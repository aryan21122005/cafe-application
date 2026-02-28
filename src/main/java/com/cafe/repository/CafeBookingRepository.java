package com.cafe.repository;

import com.cafe.entity.CafeBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CafeBookingRepository extends JpaRepository<CafeBooking, Long> {

    List<CafeBooking> findByCafeIdOrderByCreatedAtDesc(Long cafeId);
}
