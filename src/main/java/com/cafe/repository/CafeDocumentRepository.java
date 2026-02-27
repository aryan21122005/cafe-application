package com.cafe.repository;

import com.cafe.entity.CafeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CafeDocumentRepository extends JpaRepository<CafeDocument, Long> {

    List<CafeDocument> findByCafeId(Long cafeId);

    Optional<CafeDocument> findByCafeIdAndDocKey(Long cafeId, String docKey);
}
