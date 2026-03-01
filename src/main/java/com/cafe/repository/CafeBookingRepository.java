package com.cafe.repository;

import com.cafe.entity.CafeBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CafeBookingRepository extends JpaRepository<CafeBooking, Long> {

    List<CafeBooking> findByCafeIdOrderByCreatedAtDesc(Long cafeId);

    Optional<CafeBooking> findByIdAndCafeId(Long id, Long cafeId);

    List<CafeBooking> findByCustomerUsernameOrderByCreatedAtDesc(String customerUsername);

    List<CafeBooking> findByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);
}
