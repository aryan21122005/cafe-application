package com.cafe.repository;

import com.cafe.entity.CafeAmenity;
import com.cafe.entity.FunctionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CafeAmenityRepository extends JpaRepository<CafeAmenity, Long> {

    List<CafeAmenity> findByCafeIdOrderByCreatedAtDesc(Long cafeId);

    List<CafeAmenity> findByCafeIdAndEnabledOrderByCreatedAtDesc(Long cafeId, Boolean enabled);

    List<CafeAmenity> findByCafeIdAndFunctionTypeOrderByCreatedAtDesc(Long cafeId, FunctionType functionType);

    List<CafeAmenity> findByCafeIdAndFunctionTypeAndEnabledOrderByCreatedAtDesc(Long cafeId, FunctionType functionType, Boolean enabled);
}
