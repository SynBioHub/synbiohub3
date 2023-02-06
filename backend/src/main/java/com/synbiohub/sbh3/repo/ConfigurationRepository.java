package com.synbiohub.sbh3.repo;

import com.synbiohub.sbh3.entities.Configurations;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfigurationRepository extends JpaRepository<Configurations, Long> {
}
