package com.synbiohub.sbh3.entities;

import lombok.Builder;
import lombok.Data;

import javax.persistence.*;

@Entity(name = "USERS")
@Data
public class UserEntity {

    @Id
    @SequenceGenerator(name="client_generator", sequenceName="client_sequence", allocationSize=1)
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="client_generator")
    private Integer id;

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
