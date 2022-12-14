package com.synbiohub.sbh3;

import com.synbiohub.sbh3.config.model.CustomConfiguration;
import com.synbiohub.sbh3.config.repo.CustomConfigurationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@SpringBootApplication
public class Synbiohub3Application implements WebMvcConfigurer {

	private static final Logger logger = LoggerFactory.getLogger(Synbiohub3Application.class);

	@Autowired
	private CustomConfigurationRepository configurationRepository;

	public static void main(String[] args) {
		System.setProperty("org.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_SLASH", "true");
		System.setProperty("org.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_BACKSLASH", "true");
		SpringApplication.run(Synbiohub3Application.class, args);

	}

	@Bean
	public List<CustomConfiguration> configuration() {
		return configurationRepository.findAll();
	}
}
