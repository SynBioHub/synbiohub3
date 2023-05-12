package com.synbiohub.sbh3.security.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@Table(name="auth", schema = "public")
@NoArgsConstructor
@AllArgsConstructor
public class AuthCodes {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @Column(name="name")
    private String name;

    @Column(name = "auth")
    private String auth;
}
