package com.synbiohub.sbh3.config.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;

@Entity
@Table(name = "config")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class CustomConfiguration {

    @Id
    @Column
    private Long id;
    @Column(name = "instance_id")
    private Long instanceId;
    @Column
    private String config;
    @Column
    private String type;
}
