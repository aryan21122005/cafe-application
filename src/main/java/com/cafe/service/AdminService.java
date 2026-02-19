package com.cafe.service;

import com.cafe.dto.AdminDecisionRequest;
import com.cafe.dto.AdminCafeRow;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.AdminUserRow;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface AdminService {

    ResponseEntity<List<AdminUserRow>> listUsers();

    ResponseEntity<List<AdminCafeRow>> listCafes();

    ResponseEntity<AdminUserDetail> getUserDetail(Long id);

    ResponseEntity<String> approveUser(Long id);

    ResponseEntity<String> denyUser(Long id, AdminDecisionRequest request);

    ResponseEntity<String> deleteUser(Long id);

    ResponseEntity<byte[]> downloadDocument(Long id);
}
