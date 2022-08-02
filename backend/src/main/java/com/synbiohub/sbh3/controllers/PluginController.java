package com.synbiohub.sbh3.controllers;


import com.synbiohub.sbh3.services.PluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.*;
import java.net.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
@Slf4j
public class PluginController {

    private final PluginService pluginService;

    @GetMapping(value = "/plugins")
    @ResponseBody
    public String getPlugins() {
        return ConfigUtil.get("plugins").toString();
    }
    //Returns a string of all the current plugins in the instance of synbiohub


    @GetMapping(value = "/status")
    public ResponseEntity status(@RequestParam String name){

        //Name parameter can be either the plugin name or the plugin url

        String pluginURL; //Used to store the url of the plugin server
        URL url; //URL class type for the specific plugin endpoint
        HttpURLConnection connection; //Used to open an Http Connection with the plugin server


        try {
            pluginURL = pluginService.getURL(name); //From PluginService, can find a plugin url based on name or url for standardization
        }
        catch (NullPointerException e) {
            return new ResponseEntity(HttpStatus.NOT_FOUND); //If the plugin doesn't exist, a nullpointerexception will be caught
        }

        try { //Used to open a connection with the status endpoint of the plugin
            url = new URL(pluginURL + "status");
            connection = (HttpURLConnection) url.openConnection();
            connection.connect();
        }
        catch (IOException e) {
            return new ResponseEntity(HttpStatus.BAD_REQUEST);
        }


        return new ResponseEntity("The Plugin is Up and Running", HttpStatus.OK);

    }




    @PostMapping(value = "/evaluate")
    public ResponseEntity evaluate(@RequestParam String name, @RequestParam(required = false) List<MultipartFile> attached, @RequestParam(required = false) String data) {

        //Name can be the name or url of the target plugin
        //Attached is used to store files to be used for Submit plugins, will be sent to PluginService to create a manifest
        //Data is used for all components of Download/Visual Plugins and additionally can include a manifest of files for Submit plugins
        //NOTE: Currently files can only be sent for Submit plugins through attached OR data, not both


        String pluginURL;
        URL url;
        HttpURLConnection connection;
        int statusCode;
        StringBuilder answer; //Used to store the response from the plugin
        String send; //Used to store data that will be sent to the plugin
        String category;

        try {
            pluginURL = pluginService.getURL(name);
        }
        catch (NullPointerException e) {
            return new ResponseEntity(HttpStatus.NOT_FOUND);
        }

        category = pluginService.getCategory(name);

        if (attached == null) { //Used to convert send to a single string from attached/data based on which is used
            try {
                send = URLDecoder.decode(data, "UTF-8");
            } catch (IOException e) {
                return new ResponseEntity(HttpStatus.BAD_REQUEST);
            }
        }
        else {
            send = pluginService.buildManifest(attached).toString();
        }



        try {
            //Open a connection and set the method as post
            url = new URL(pluginURL + "evaluate");
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");

            //Send information from the "send" variable to the plugin
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            OutputStream os = connection.getOutputStream();
            byte[] input = send.getBytes("utf-8");
            os.write(input, 0, input.length);

            //Catch the response from the plugin in a string
            BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream(), "utf-8"));
            answer = new StringBuilder();
            String responseLine = null;
            while ((responseLine = br.readLine()) != null) {
                answer.append(responseLine.trim());
            }

            statusCode = connection.getResponseCode();
        }
        catch (IOException e) {
            return new ResponseEntity(HttpStatus.BAD_REQUEST);
        }


        HttpHeaders responseHeaders = new HttpHeaders();

        if(category == "submit") {
            responseHeaders.set("Content-Type", "application/json");
        }
        else {
            responseHeaders.set("Content-Type", "text/plain");
        }

        return ResponseEntity.status(HttpStatus.valueOf(statusCode)).headers(responseHeaders).body(answer);

        //Either returns a message with the accepted component type, or a string of JSON with a manifest of files


    }

    @PostMapping(value = "/test")
    public void test(@RequestParam String message) {
        try {
            message = URLDecoder.decode(message, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            message += " failed";
        }
        log.info(message);
    }





    @PostMapping(value = "/run", produces = "application/zip")
    public ResponseEntity run(@RequestParam String name, @RequestParam(required = false) List<MultipartFile> attached, @RequestParam(required = false) String data) {

        //All code should have the same uses as in the /evaluate endpoint

        String pluginURL;
        URL url;
        HttpURLConnection connection;
        int statusCode;
        StringBuilder answer;
        String send;
        String category;
        byte[] responseArray;

        try {
            pluginURL = pluginService.getURL(name);
        }
        catch (NullPointerException e) {
            return new ResponseEntity(HttpStatus.NOT_FOUND);
        }

        category = pluginService.getCategory(name);

        if (attached == null) {
            try {
                send = URLDecoder.decode(data, "UTF-8");
            } catch (IOException e) {
                return new ResponseEntity(HttpStatus.BAD_REQUEST);
            }
        }
        else {
            send = pluginService.buildManifest(attached).toString();
        }


        try {
            url = new URL(pluginURL + "run");
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");

            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            OutputStream os = connection.getOutputStream();
            byte[] input = send.getBytes("utf-8");
            os.write(input, 0, input.length);

            BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream(), "utf-8"));
            answer = new StringBuilder();
            String responseLine = null;
            while ((responseLine = br.readLine()) != null) {
                answer.append(responseLine.trim());
            }

            responseArray = answer.toString().getBytes();

            statusCode = connection.getResponseCode();
        }
        catch (IOException e) {
            return new ResponseEntity(HttpStatus.BAD_REQUEST);
        }


        HttpHeaders responseHeaders = new HttpHeaders();

        if (category == "visual") {
            responseHeaders.set("Content-Type", "text/html");
            return ResponseEntity.status(HttpStatus.valueOf(statusCode)).headers(responseHeaders).body(answer);
        }
        else if (category == "submit") {
            responseHeaders.set("Content-Type", "application/zip");
        }
        else {
            responseHeaders.set("Content-Type", "application/octet-stream");
        }

        return ResponseEntity.status(HttpStatus.valueOf(statusCode)).headers(responseHeaders).body(responseArray);



    }



    @PostMapping(value = "/save")
    public String save() {
        return "Save successful\n";
    }

    @PostMapping(value = "/parameters")
    public String parameters() {
        return "Parameters successful\n";
    }


    @PostMapping(value = "/call")
    public ResponseEntity callPlugin(@RequestParam(required = false) String token, @RequestParam String name, @RequestParam(required = false) List<MultipartFile> attached, @RequestParam String endpoint, @RequestParam(required = false) String data) {



        switch(endpoint) {
            case "status":
                return status(name);
            case "evaluate":
                return evaluate(name, attached, data);
            case "run":
                return  run(name, attached, data);
            default :
                return new ResponseEntity("Unsuccessful", HttpStatus.BAD_REQUEST);
        }

    }




/*
    @PostMapping(value = "/update")
    public String update(@RequestParam String method, @RequestParam File dictionary) {

        String test = "";

        switch(method) {
            case "add":
                test += "Add successful\n";
                break;
            case "update":
                test += "Update successful\n";
                break;
            case "delete":
                test += "Delete successful\n";
                break;
            case "overwrite":
                test += "Overwrite successful\n";
                break;
            default :
                test += "Unsuccessful\n";
                break;
        }
        return test;
    }
    
 */

}
