package com.synbiohub.sbh3.config.repo;

import com.synbiohub.sbh3.entities.Plugins;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PluginsRepository extends JpaRepository<Plugins, Long> {
}
