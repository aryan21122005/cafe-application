package com.cafe.repository;

import com.cafe.entity.CafeOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CafeOrderRepository extends JpaRepository<CafeOrder, Long> {

    List<CafeOrder> findByCafeIdOrderByCreatedAtDesc(Long cafeId);

    List<CafeOrder> findByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);

    List<CafeOrder> findByCustomerUsernameOrderByCreatedAtDesc(String customerUsername);

    @Query("select distinct o from CafeOrder o left join fetch o.items")
    List<CafeOrder> findAllWithItems();

    Optional<CafeOrder> findByIdAndCafeId(Long id, Long cafeId);

    @Query("select max(o.orderNumber) from CafeOrder o where o.cafe.id = :cafeId")
    Integer findMaxOrderNumberByCafeId(@Param("cafeId") Long cafeId);
}
