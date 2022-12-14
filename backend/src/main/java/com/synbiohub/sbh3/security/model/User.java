package com.synbiohub.sbh3.security.model;

import lombok.Data;

import javax.persistence.*;

@Entity
@Data
@Table(name="users", schema = "public")
public class User {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "username")
    private String username;

    @Column(name = "password")
    private String password;

    @Column(name = "email")
    private String email;

    @Column(name = "affiliation")
    private String affiliation;

    @Column(name = "isAdmin")
    private Boolean isAdmin;

    @Column(name = "isCurator")
    private Boolean isCurator;
}
