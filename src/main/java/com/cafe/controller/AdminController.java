package com.cafe.controller;

import com.cafe.dto.AdminDecisionRequest;
import com.cafe.dto.AdminCafeRow;
import com.cafe.dto.AdminOwnerRow;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.AdminUserRow;
import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.RegisterRequest;
import com.cafe.dto.MenuItemRow;
import com.cafe.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserRow>> listUsers() {
        return adminService.listUsers();
    }

    @GetMapping("/cafes")
    public ResponseEntity<List<AdminCafeRow>> listCafes() {
        return adminService.listCafes();
    }

    @GetMapping("/owners")
    public ResponseEntity<List<AdminOwnerRow>> listOwners() {
        return adminService.listOwners();
    }

    @PostMapping(value = "/owners", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> createOwner(
            @RequestPart("data") RegisterRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return adminService.createOwner(request, documents);
    }

    @PostMapping("/cafes")
    public ResponseEntity<AdminCafeRow> createCafeForOwner(
            @RequestHeader(value = "X-OWNER-USERNAME", required = false) String ownerUsername,
            @RequestBody CafeProfileRequest request
    ) {
        return adminService.createCafeForOwner(ownerUsername, request);
    }

    @GetMapping("/cafes/{id}/menu")
    public ResponseEntity<List<MenuItemRow>> listCafeMenu(@PathVariable Long id) {
        return adminService.listCafeMenu(id);
    }

    @DeleteMapping("/cafes/{id}")
    public ResponseEntity<String> deleteCafe(@PathVariable Long id) {
        return adminService.deleteCafe(id);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetail> getUserDetail(@PathVariable Long id) {
        return adminService.getUserDetail(id);
    }

    @PostMapping("/users/{id}/approve")
    public ResponseEntity<String> approveUser(@PathVariable Long id) {
        return adminService.approveUser(id);
    }

    @PostMapping("/users/{id}/deny")
    public ResponseEntity<String> denyUser(@PathVariable Long id, @RequestBody(required = false) AdminDecisionRequest request) {
        return adminService.denyUser(id, request);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        return adminService.deleteUser(id);
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long id) {
        return adminService.downloadDocument(id);
    }
}
