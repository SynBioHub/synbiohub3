package com.synbiohub.sbh3.controllers;


import com.synbiohub.sbh3.services.PluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
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
    @GetMapping(value = "/status")
    public String status(@RequestParam String name){

        String pluginURL;
        URL url;
        HttpURLConnection connection;
        int statusCode;


        try {
            pluginURL = pluginService.getURL(name);
        }
        catch (NullPointerException e) {
            statusCode = 404;
            return statusCode + ": Plugin not Found\n";
        }

        try {
            url = new URL(pluginURL + "status");
            connection = (HttpURLConnection) url.openConnection();
            connection.connect();
            statusCode = connection.getResponseCode();
        }
        catch (IOException e) {
            statusCode = 500;
            return statusCode + ": Connection Unsuccessful\n";
        }


        if (statusCode != 200) {
            return statusCode + ": The Plugin is Not Responding\n";
        }

        return statusCode + ": The Plugin is Up and Running\n";
    }




    @PostMapping(value = "/evaluate")
    public String evaluate(@RequestParam String name, @RequestParam(required = false) File [] attached, @RequestParam(required = false) File data) {

        String pluginURL;
        URL url;
        HttpURLConnection connection;
        int statusCode;
        StringBuilder answer;
        String send;

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
            statusCode = 404;
            return statusCode + ": Plugin not Found\n";
        }


        try {
            url = new URL(pluginURL + "evaluate");
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

            statusCode = connection.getResponseCode();
        }
        catch (IOException e) {
            statusCode = 500;
            return statusCode + ": Unsuccessful\n";
        }


        return statusCode + ": Evaluate successful\n" + answer.toString() + "\n";


    }






    @PostMapping(value = "/run")
    public String run(@RequestParam String name, @RequestParam(required = false) File [] attached, @RequestParam(required = false) File data) {
        String pluginURL;
        URL url;
        HttpURLConnection connection;
        int statusCode;
        StringBuilder answer;
        String send;

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
            statusCode = 404;
            return statusCode + ": Plugin not Found\n";
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

            statusCode = connection.getResponseCode();
        }
        catch (IOException e) {
            statusCode = 500;
            return statusCode + ": Unsuccessful\n";
        }



        return statusCode + ": Run successful\n" + answer.toString() + "\n";


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
    public String callPlugin(@RequestParam(required = false) String token, @RequestParam String name, @RequestParam(required = false) File [] attached, @RequestParam String endpoint, @RequestParam(required = false) File data) {



        String test = "";

        switch(endpoint) {
            case "status":
                test += status(name);
                break;
            case "evaluate":
                test += evaluate(name, attached, data);
                break;
            case "run":
                test += run(name, attached, data);
                break;
            case "save":
                test += save();
                break;
            case "parameters":
                test += parameters();
                break;
            default :
                test += "Unsuccessful \n";
                break;
        }

        return test;
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
