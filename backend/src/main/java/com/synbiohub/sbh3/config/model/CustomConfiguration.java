package com.synbiohub.sbh3.config.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;

@Entity
@Table(name = "config")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class CustomConfiguration {

    @Id
    @Column
    private String key;
    @Column
    private String value;
}
