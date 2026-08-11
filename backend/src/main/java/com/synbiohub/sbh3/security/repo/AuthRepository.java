package com.synbiohub.sbh3.security.repo;

import com.synbiohub.sbh3.security.model.AuthCodes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthRepository extends JpaRepository<AuthCodes, Integer> {
    Optional<AuthCodes> findByName(String name);

    Optional<AuthCodes> findByAuth(String auth);
}
