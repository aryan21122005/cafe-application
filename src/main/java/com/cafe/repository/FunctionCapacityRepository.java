package com.cafe.repository;

import com.cafe.entity.FunctionCapacity;
import com.cafe.entity.FunctionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FunctionCapacityRepository extends JpaRepository<FunctionCapacity, Long> {

    List<FunctionCapacity> findByCafeId(Long cafeId);

    Optional<FunctionCapacity> findByCafeIdAndFunctionType(Long cafeId, FunctionType functionType);
}
