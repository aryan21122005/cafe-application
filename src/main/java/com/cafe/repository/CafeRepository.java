package com.cafe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Cafe;

public interface CafeRepository extends JpaRepository<Cafe, Long> {

    List<Cafe> findByOwner_UsernameOrderByIdDesc(String ownerUsername);

    Optional<Cafe> findFirstByOwner_UsernameOrderByIdDesc(String ownerUsername);

    Optional<Cafe> findByIdAndOwner_Username(Long id, String ownerUsername);

    Optional<Cafe> findByStaff_Username(String username);

    List<Cafe> findByApprovalStatus(ApprovalStatus approvalStatus);
}
