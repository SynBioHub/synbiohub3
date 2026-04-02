package com.synbiohub.sbh3.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.synbiohub.sbh3.Synbiohub3Application;
import com.synbiohub.sbh3.dto.LoginDTO;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.customsecurity.AuthenticationResponse;
import com.synbiohub.sbh3.security.customsecurity.JwtService;
import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.model.Role;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.security.repo.UserRepository;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.ILoggerFactory;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.sql.*;
import java.util.*;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final SearchService searchService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final AuthRepository authRepository;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    public String loginUser(String username, String password) {
        LoginDTO loginRequest = LoginDTO
                .builder()
                .username(username)
                .password(password)
                .build();
        AuthenticationResponse response = authenticate(loginRequest); // generate JWT
        if (authRepository.findByName(username).isPresent()) {
            AuthCodes authCode = authRepository.findByName(username).get();
            authCode.setAuth(response.getToken());
            authRepository.save(authCode);
        } else { // save the jwt in the authcode db
            AuthCodes authCode = AuthCodes.builder()
                    .name(username)
                    .auth(response.getToken())
                    .build();
            authRepository.save(authCode);
        }
        return response.getToken();
    }

    public String logoutUser(HttpServletRequest request) throws Exception {
        // from 1/20/26
        String token = request.getHeader("X-authorization");
        if (token != null && !token.isBlank()) {
            // remove JWT from the whitelist
            authRepository.findByAuth(token).ifPresent(authRepository::delete);

            // clear the current request's session memory
            SecurityContextHolder.clearContext();

            log.info("Token invalidated and removed from DB.");
            return "User logged out successfully";
        }

        return "No active session found to log out";
    }

    /**
     * This function, during login, will take in the loginDTO and generate the jwtToken.
     * @param loginDTO
     * @return
     */
    public AuthenticationResponse authenticate(LoginDTO loginDTO) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginDTO.getUsername(),
                        loginDTO.getPassword()
                ));
        var user = userRepository.findByUsername(loginDTO.getUsername())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse
                .builder()
                .token(jwtToken)
                .build();
    }

    /**
     * This is the main method to check one's authentication.
     * It will check both the security context and the authTokens table to verify the user is logged in.
     *
     * Currently not used. Eventually will be deprecated out and deleted.
     * @param inputToken
     * @return
     * @throws Exception
     */
    //TODO: either delete this or put inside filter when filter is done
    public Authentication checkAuthentication(String inputToken) throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AnonymousAuthenticationToken || authentication == null) return null;
        var authCode = authRepository.findByName(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authentication not found")); // TODO: requires error handling, find out what SBH1 returns
        if (inputToken.equals(authCode.getAuth())) {
            return authentication;
        } else {
            throw new Exception("Authentication failed.");
        }
    }

    /**
     * Helper function for registering a new user.
     * @param userRegistrationDTO
     * @return
     */
    public AuthenticationResponse register(UserRegistrationDTO userRegistrationDTO) {
        if (!verifyPasswords(userRegistrationDTO.getPassword1(), userRegistrationDTO.getPassword2())) {
            return AuthenticationResponse
                    .builder()
                    .token("User registration failed")
                    .build();
        }
        var user = User
                .builder()
                .username(userRegistrationDTO.getUsername())
                .name(userRegistrationDTO.getName())
                .email(userRegistrationDTO.getEmail())
                .affiliation(userRegistrationDTO.getAffiliation())
                .password(passwordEncoder.encode(userRegistrationDTO.getPassword1()))
                .role(Role.ADMIN)
                .isMember(true)
                .isCurator(false)
                .build();
        user.setGraphUri("https://synbiohub.org/user/" + user.getUsername());
        user.setIsAdmin(user.getRole().equals(Role.ADMIN));
        userRepository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse
                .builder()
                .token("User registered successfully")
                .build();
    }

    /**
     * This function checks if the inputted string is a valid email address.
     *
     * @param email
     * @return
     */
    public boolean isValidEmail(String email)
    {
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\."+
                "[a-zA-Z0-9_+&*-]+)*@" +
                "(?:[a-zA-Z0-9-]+\\.)+[a-z" +
                "A-Z]{2,17}$";

        Pattern pat = Pattern.compile(emailRegex);
        if (email == null)
            return false;
        return pat.matcher(email).matches();
    }

// from (1/20/26)
public User getUserProfile() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
        if (auth.getPrincipal() instanceof User) {
            User user = (User) auth.getPrincipal();
            // reload from DB to ensure it's fresh
            return userRepository.findByUsername(user.getUsername()).orElse(null);
        }
    }
    return null;
}




// from (1/20/26)
public User updateUserProfile(Map<String, String> allParams) throws Exception {
    User existingUser = getUserProfile();
    if (existingUser == null) {
        throw new Exception("User not found");
    }

    updateUserFields(existingUser, allParams);

    // Save the changes to the database. the GET will always pull from this DB
    return userRepository.save(existingUser);
}

    public String setupInstance(Map<String, Object> allParams) {
        String fileName = "config.local.json";
        String workingDirectory = System.getProperty("user.dir") + "/data";
        File file = new File(workingDirectory + File.separator + fileName);

        ObjectMapper mapper = new ObjectMapper();
        mapper.enable(SerializationFeature.INDENT_OUTPUT);

        Map<String, String> userParams = new HashMap<>();
        UserRegistrationDTO userRegistrationDTO = UserRegistrationDTO
                .builder()
                .username((String) allParams.get("userName"))
                .name((String) allParams.get("userFullName"))
                .affiliation((String) allParams.get("affiliation"))
                .email((String) allParams.get("userEmail"))
                .password1((String) allParams.get("userPassword"))
                .password2((String) allParams.get("userPasswordConfirm"))
                .build();
        register(userRegistrationDTO);

        allParams.remove("userName");
        allParams.remove("userFullName");
        allParams.remove("affiliation");
        allParams.remove("userEmail");
        allParams.remove("userPassword");
        allParams.remove("userPasswordConfirm");

        try {
            if (file.createNewFile()) {
                allParams.put("sparqlEndpoint", "http://virtuoso3:8890/sparql");
                allParams.put("graphStoreEndpoint", "http://virtuoso3:8890/sparql-graph-crud-auth/");
                allParams.put("firstLaunch", false);
                allParams.put("version", 1);
                Map<String, String> wor = new HashMap<>();
                wor.put("https://synbiohub.org", "http://localhost:6789");
                allParams.put("webOfRegistries", wor);// TODO: Make sure web of registries is correct
                Map<String, Object> themeParams = new HashMap<>();
                themeParams.put("default", allParams.get("color"));
                allParams.put("themeParameters", themeParams);
                allParams.remove("color");
                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
                ObjectWriter writer = objectMapper.writerWithDefaultPrettyPrinter();
                String json = writer.writeValueAsString(allParams);
                FileWriter fw = new FileWriter(file.getAbsoluteFile());
                BufferedWriter bw = new BufferedWriter(fw);
                bw.write(json);
                bw.close();
                ConfigUtil.refreshLocalJson();
                log.info("Setup successful!");
                return "Setup Successful";
            } else {
                log.info("Local file already exists. Setup proceeds.");
                return "File already exists!";
            }
        } catch (IOException e) {
            log.error("Setup failed.");
            return "Failed to create file!";
        }
    }

    /**
     * Compares the user's X-authorization token to the one passed in
     * @param xauth X-authorization token passed in from HTTP header
     * @return True if the tokens are the same, false otherwise.
     */
    public Boolean validateXAuth(String xauth) {
        return RequestContextHolder.currentRequestAttributes().getSessionId().equals(xauth);
    }

    /**
     * Compares a part to see if it matches a user's graph.
     * The user's graph is the default graph + "/user" + their username.
     * @return True if it matches, false otherwise.
     */
    public Boolean isOwnedBy(String topLevelUri) throws IOException {
        SPARQLQuery query = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/GetOwnedBy.sparql");
        String results = searchService.SPARQLQuery(query.loadTemplate(Collections.singletonMap("topLevel", topLevelUri)));
        ArrayList<String> owners = new ArrayList<>();
        try {
            var mapper = new ObjectMapper();
            JsonNode rawTree = mapper.readTree(results);
            for(JsonNode node : rawTree.get("results").get("bindings")) {
                for (Iterator<Map.Entry<String, JsonNode>> it = node.fields(); it.hasNext(); ) {
                    Map.Entry<String, JsonNode> subNode = it.next();
                    owners.add(subNode.getValue().get("value").asText());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return owners.contains(ConfigUtil.get("graphPrefix").asText() + "user/" + SecurityContextHolder.getContext().getAuthentication().getName());
    }

    private void updateUserFields(User user, Map<String, String> allParams) {
        if (allParams.get("name") != null) {
            user.setName(allParams.get("name"));
        }
        if (allParams.get("email") != null) {
            user.setEmail(allParams.get("email"));
        }
        if (allParams.get("affiliation") != null) {
            user.setAffiliation(allParams.get("affiliation"));
        }
    }

    public Map<String, String> registerNewAdminUser(Map<String, String> allParams) {
        Map<String, String> registerParams = new HashMap<>();
        registerParams.put("username", allParams.get("userName"));
        registerParams.put("name", allParams.get("userFullName"));
        registerParams.put("affiliation", allParams.get("affiliation"));
        registerParams.put("email", allParams.get("userEmail"));
        registerParams.put("password1", allParams.get("userPassword"));
        registerParams.put("password2", allParams.get("userPasswordConfirm"));
        return registerParams;

    }

    private Boolean verifyPasswords(String password1, String password2) {
        return password1.equals(password2);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User getUserByUsername(String username) {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        return optionalUser.orElse(null);
    }

    public User getUserByEmail(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        return optionalUser.orElse(null);

    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Set<User> connect(String dbName) {
        Connection conn = null;
        ResultSet resultSet = null;
        Set<User> users = new HashSet<>();
        try {
            // db parameters
            String url = "jdbc:sqlite:" + dbName;
            // create a connection to the database
            conn = DriverManager.getConnection(url);

            System.out.println("Connection to SQLite has been established.");

            PreparedStatement statement = conn.prepareStatement("SELECT * FROM user");
            resultSet = statement.executeQuery();
            while (resultSet.next()) {
                User user = User.builder()
                        .id((long)resultSet.getInt("id"))
                        .name(resultSet.getString("name"))
                        .username(resultSet.getString("username"))
                        .email(resultSet.getString("email"))
                        .affiliation(resultSet.getString("affiliation"))
                        .password("{salt}" + resultSet.getString("password"))
                        .role(Role.USER)
                        .build();
                users.add(user);
            }

        } catch (SQLException e) {
            System.out.println(e.getMessage());
        } finally {
            try {
                if (resultSet != null) {
                    resultSet.close();
                }
            } catch (SQLException ex) {
                System.out.println(ex.getMessage());
            }
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException ex) {
                System.out.println(ex.getMessage());
            }
        }
        return users;
    }

}
