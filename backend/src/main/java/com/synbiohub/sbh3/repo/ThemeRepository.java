package com.synbiohub.sbh3.repo;

import com.synbiohub.sbh3.entities.configentities.Theme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ThemeRepository extends JpaRepository<Theme, Long> {
}
