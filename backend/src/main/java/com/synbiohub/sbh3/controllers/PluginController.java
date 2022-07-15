package com.synbiohub.sbh3.controllers;


import com.synbiohub.sbh3.services.PluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.net.*;

@RestController
@AllArgsConstructor
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
    public ResponseEntity evaluate(@RequestParam String name, @RequestParam(required = false) File [] attached, @RequestParam(required = false) String type, @RequestParam(required = false) File data) {

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

        if (attached == null) { //Used to convert send to a single string from attached/data based on which is used
            if (type == null) {
                send = data.toString();
            }
            else {
                send = pluginService.buildType(type).toString();
            }
        }
        else {
            send = pluginService.buildManifest(attached).toString();
        }


        try {
            pluginURL = pluginService.getURL(name);
        }
        catch (NullPointerException e) {
            return new ResponseEntity(HttpStatus.NOT_FOUND);
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


        return new ResponseEntity(answer + "\n", HttpStatus.valueOf(statusCode));
        //Either returns a message with the accepted component type, or a string of JSON with a manifest of files


    }






    @PostMapping(value = "/run")
    public ResponseEntity run(@RequestParam String name, @RequestParam(required = false) File [] attached, @RequestParam(required = false) File data) {

        //All code should have the same uses as in the /evaluate endpoint

        String pluginURL;
        URL url;
        HttpURLConnection connection;
        int statusCode;
        StringBuilder answer;
        String send;
        byte[] responseArray;

        if (attached == null) {
            send = data.toString();

        }
        else {
            send = pluginService.buildManifest(attached).toString();
        }



        try {
            pluginURL = pluginService.getURL(name);
        }
        catch (NullPointerException e) {
            return new ResponseEntity(HttpStatus.NOT_FOUND);
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



        return new ResponseEntity(responseArray, HttpStatus.valueOf(statusCode));


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
    public ResponseEntity callPlugin(@RequestParam(required = false) String token, @RequestParam String name, @RequestParam(required = false) File [] attached, @RequestParam(required = false) String type, @RequestParam String endpoint, @RequestParam(required = false) File data) {



        switch(endpoint) {
            case "status":
                return status(name);
            case "evaluate":
                return evaluate(name, attached, type, data);
            case "run":
                return run(name, attached, data);
            default :
                return new ResponseEntity("Unsuccessful", HttpStatus.BAD_REQUEST);
        }

    }




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

}
