package com.synbiohub.sbh3.entities.configentities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Entity
@Table(name = "Triple_Stores")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripleStore {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sparql_endpoint")
    private String sparqlEndpoint;
    @Column(name = "graph_store_endpoint")
    private String graphStoreEndpoint;
    @Column(name = "default_graph")
    private String defaultGraph;
    @Column(name = "graph_prefix")
    private String graphPrefix;
    @Column
    private String username;
    @Column
    private String password;
    @Column(name = "virtuoso_ini")
    private String virtuosoINI;
    @Column(name = "virtuoso_db")
    private String virtuosoDB;
    @Column
    private String isql;

}
