package com.synbiohub.sbh3;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Synbiohub3Application {

	private static final Logger logger = LoggerFactory.getLogger(Synbiohub3Application.class);

	public static void main(String[] args) {
		SpringApplication.run(Synbiohub3Application.class, args);
	}

}
