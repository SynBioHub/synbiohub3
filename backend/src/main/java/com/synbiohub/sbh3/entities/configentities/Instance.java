package com.synbiohub.sbh3.entities.configentities;

import com.synbiohub.sbh3.entities.Configurations;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Entity
@Table(name = "Instances")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Instance {
    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "instance_uri")
    private String instanceUri;
    @Column
    private String description;
    @Column
    private String name;
    @OneToOne(mappedBy = "instance")
    private Configurations configuration;
}
