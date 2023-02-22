package com.synbiohub.sbh3.entities;

import com.synbiohub.sbh3.entities.configentities.*;
import com.synbiohub.sbh3.security.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Configurations {

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @OneToOne
    @JoinColumn(name = "instance_id")
    private Instance instance;

    @ManyToOne
    @JoinColumn(name = "theme_id")
    private Theme theme;

    @Column
    private int port;

    @ManyToOne
    @JoinColumn(name = "triple_store_id")
    private TripleStore triplestore;

    @ManyToMany
    @JoinTable(
            name = "User_Configurations",
            joinColumns = @JoinColumn(name = "configuration_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> users;

    @Column(name = "allow_public_signup")
    private Boolean allowPublicSignup;
}
