package com.cafe.repository;

import com.cafe.entity.CafeImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CafeImageRepository extends JpaRepository<CafeImage, Long> {

    List<CafeImage> findByCafeId(Long cafeId);
}
