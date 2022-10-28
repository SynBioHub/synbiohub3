package com.synbiohub.sbh3;

import org.joda.time.field.StrictDateTimeField;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.web.firewall.StrictHttpFirewall;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.util.UrlPathHelper;

@SpringBootApplication
public class Synbiohub3Application implements WebMvcConfigurer {

	private static final Logger logger = LoggerFactory.getLogger(Synbiohub3Application.class);

	public static void main(String[] args) {
		System.setProperty("org.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_SLASH", "true");
		System.setProperty("org.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_BACKSLASH", "true");
		SpringApplication.run(Synbiohub3Application.class, args);

	}
}
