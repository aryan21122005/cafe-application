package com.cafe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cafe.entity.CafeOrder;

public interface CafeOrderRepository extends JpaRepository<CafeOrder, Long> {

    List<CafeOrder> findByCafeIdOrderByCreatedAtDesc(Long cafeId);

    List<CafeOrder> findByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);

    List<CafeOrder> findByCustomerUsernameOrderByCreatedAtDesc(String customerUsername);

    List<CafeOrder> findByBookingId(Long bookingId);

    @Query("select distinct o from CafeOrder o left join fetch o.items")
    List<CafeOrder> findAllWithItems();

    @Query("select distinct o from CafeOrder o left join fetch o.items where o.cafe.id = :cafeId")
    List<CafeOrder> findByCafeIdWithItems(@Param("cafeId") Long cafeId);

    Optional<CafeOrder> findByIdAndCafeId(Long id, Long cafeId);

    @Query("select max(o.orderNumber) from CafeOrder o where o.cafe.id = :cafeId")
    Integer findMaxOrderNumberByCafeId(@Param("cafeId") Long cafeId);
}
