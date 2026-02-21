package com.cafe.service;

import com.cafe.dto.AdminDecisionRequest;
import com.cafe.dto.AdminCafeRow;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.AdminUserRow;
import com.cafe.dto.RegisterRequest;
import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.AdminOwnerRow;
import com.cafe.dto.MenuItemRow;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AdminService {

    ResponseEntity<List<AdminUserRow>> listUsers();

    ResponseEntity<List<AdminCafeRow>> listCafes();

    ResponseEntity<List<AdminOwnerRow>> listOwners();

    ResponseEntity<String> createOwner(RegisterRequest request, List<MultipartFile> documents);

    ResponseEntity<AdminCafeRow> createCafeForOwner(String ownerUsername, CafeProfileRequest request);

    ResponseEntity<List<MenuItemRow>> listCafeMenu(Long cafeId);

    ResponseEntity<AdminUserDetail> getUserDetail(Long id);

    ResponseEntity<String> approveUser(Long id);

    ResponseEntity<String> denyUser(Long id, AdminDecisionRequest request);

    ResponseEntity<String> deleteUser(Long id);

    ResponseEntity<byte[]> downloadDocument(Long id);
}
