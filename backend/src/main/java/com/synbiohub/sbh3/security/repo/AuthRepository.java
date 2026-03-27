package com.synbiohub.sbh3.security.repo;

import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthRepository extends JpaRepository<AuthCodes, Integer> {
    Optional<AuthCodes> findByName(String name);

    Optional<List<AuthCodes>> findAuthCodesByName(String name);

    Optional<AuthCodes> findByAuth(String auth);

}
