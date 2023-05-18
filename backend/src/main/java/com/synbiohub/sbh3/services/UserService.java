package com.synbiohub.sbh3.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dto.LoginDTO;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.customsecurity.AuthenticationResponse;
import com.synbiohub.sbh3.security.customsecurity.JwtService;
import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.model.Role;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.security.repo.UserRepository;
import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;

import java.io.IOException;
import java.sql.*;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final SearchService searchService;

    private final CustomUserService customUserService;
    private final ConfigUtil configUtil;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    private final AuthRepository authRepository;

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
        if (user.getRole().equals(Role.ADMIN)) {
            user.setIsAdmin(true);
        } else {
            user.setIsAdmin(false);
        }
        userRepository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse
                .builder()
                .token("User registered successfully")
                .build();
    }

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

    public User getUserProfile(String inputToken) throws Exception {
        Authentication authentication = checkAuthentication(inputToken);
        if (authentication == null) {
            return null;
        }
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        User copyUser = (User) user.clone();
        copyUser.setPassword("");
        return copyUser;
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

    public User updateUser(Map<String, String> allParams, String inputToken) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        Authentication auth = checkAuthentication(inputToken);
        User existingUser = getUserProfile(inputToken);
        if (existingUser == null || auth == null) {
            return null;
        }
        updateUserFields(existingUser, allParams);
        return existingUser;
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

    public Authentication checkValidLogin(AuthenticationManager authenticationManager, String email, String password) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            return null;
        }
        return auth;
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

    public Authentication checkAuthentication(String inputToken) throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AnonymousAuthenticationToken || authentication == null) return null;
        String name = authentication.getName();
        var authCode = authRepository.findByName(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authentication not found")); // TODO: requires error handling, find out what SBH1 returns
        if (inputToken.equals(authCode.getAuth())) {
            return authentication;
        } else {
            throw new Exception("Authentication failed.");
        }

    }

    private Boolean verifyPasswords(String password1, String password2) {
        return password1.equals(password2);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User getUserByUsername(String username) {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        return optionalUser.get();
    }

    public User getUserByEmail(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        return optionalUser.get();

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
