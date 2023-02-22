package com.synbiohub.sbh3.repo;

import com.synbiohub.sbh3.entities.configentities.Instance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstanceRepository extends JpaRepository<Instance, Long> {
}
