package com.synbiohub.sbh3.entities.configentities;

import lombok.Data;

import java.util.Collection;

@Data
public class Plugins {
    private Collection<String> rendering;
    private Collection<String> download;
    private Collection<String> submit;
    private Collection<String> authorization;


}
