package com.synbiohub.sbh3.sqlite;

import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import java.sql.Timestamp;

@Data
@Entity(name = "users")
public class User {

    // Auto-incremented primary key
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    private Integer id;

    private String name;

    private String username;

    private String email;

    private String affiliation;

    private String password;

    private String graphUri;

    private Boolean isAdmin;

    private String resetPasswordLink;

    private Boolean isCurator;

    private Boolean isMember;

    // non-null columns
    @Column(nullable = false)
    private Timestamp createdAt;

    @Column(nullable = false)
    private Timestamp updatedAt;

}
