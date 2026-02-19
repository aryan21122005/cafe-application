package com.cafe.controller;

import com.cafe.dto.LoginRequest;
import com.cafe.dto.LoginResponse;
import com.cafe.dto.ChangePasswordRequest;
import com.cafe.dto.RegisterRequest;
import com.cafe.service.AuthApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthApiService authApiService;
    
     
    // ---------- REGISTER ----------
    @PostMapping("/register")
    public ResponseEntity<String> register(
            @RequestBody RegisterRequest request
    ) {
        return authApiService.register(request);
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> registerWithDocuments(
            @RequestPart("data") RegisterRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return authApiService.registerWithDocuments(request, documents);
    }

    // ---------- TEST ----------
    @GetMapping("/register")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Auth API working");
    }

    // ---------- LOGIN ----------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return authApiService.login(request);
    }

    // ---------- CHANGE PASSWORD ----------
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        return authApiService.changePassword(request);
    }
    
}
