package com.synbiohub.sbh3.security.repo;

import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthRepository extends JpaRepository<AuthCodes, Integer> {
    Optional<User> findByName(String name);
}
