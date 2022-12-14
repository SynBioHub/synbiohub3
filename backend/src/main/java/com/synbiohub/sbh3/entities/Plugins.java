package com.synbiohub.sbh3.entities;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Data
public class Plugins {

    @Id
    @Column
    private Long id;

    @Column
    private String name;

    @Column(name = "login_url")
    private String loginUrl;

    @Column(name = "logout_url")
    private String logoutUrl;

    @Column(name = "refresh_url")
    private String refreshUrl;

    @Column(name = "status_url")
    private String statusUrl;
}
