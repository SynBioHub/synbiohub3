package com.synbiohub.sbh3.entities.configentities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Entity
@Table(name = "Themes")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Theme {
    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "theme_name")
    private String themeName;
    @Column(name = "base_color")
    private String baseColor; // hexadecimal number

}
