package com.cafe.controller;

import com.cafe.dto.AdminDecisionRequest;
import com.cafe.dto.AdminCafeRow;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.AdminUserRow;
import com.cafe.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
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
