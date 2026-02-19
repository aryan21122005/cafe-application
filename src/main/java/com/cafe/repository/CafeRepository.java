package com.cafe.repository;

import com.cafe.entity.Cafe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CafeRepository extends JpaRepository<Cafe, Long> {

    Optional<Cafe> findByOwnerUsername(String ownerUsername);
}
