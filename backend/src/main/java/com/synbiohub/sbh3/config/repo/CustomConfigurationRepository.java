package com.synbiohub.sbh3.config.repo;

import com.synbiohub.sbh3.config.model.CustomConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomConfigurationRepository extends JpaRepository<CustomConfiguration, String> {
}
