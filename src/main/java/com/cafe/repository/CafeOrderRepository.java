package com.cafe.repository;

import com.cafe.entity.CafeOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CafeOrderRepository extends JpaRepository<CafeOrder, Long> {

    List<CafeOrder> findByCafeIdOrderByCreatedAtDesc(Long cafeId);
}
