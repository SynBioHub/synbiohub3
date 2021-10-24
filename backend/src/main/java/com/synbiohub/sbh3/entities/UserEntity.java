package com.synbiohub.sbh3.entities;

import lombok.Builder;
import lombok.Data;

import javax.persistence.*;

@Entity(name = "USERS")
@Data
public class UserEntity {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "NAME")
    private String name;

    @Column(name = "USERNAME")
    private String username;

    @Column(name = "PASSWORD")
    private String password;

    @Column(name = "EMAIL")
    private String email;

    @Column(name = "AFFILIATION")
    private String affiliation;

    @Column(name = "ISADMIN")
    private Boolean isAdmin;

    @Column(name = "ISCURATOR")
    private Boolean isCurator;
}
