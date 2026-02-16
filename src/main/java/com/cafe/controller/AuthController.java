package com.cafe.controller;

import com.cafe.dto.LoginRequest;
import com.cafe.dto.LoginResponse;
import com.cafe.dto.ChangePasswordRequest;
import com.cafe.dto.RegisterRequest;
import com.cafe.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;
    
     
    // ---------- REGISTER ----------
    @PostMapping("/register")
    public ResponseEntity<String> register(
            @RequestHeader(value = "X-ADMIN-KEY", required = false) String adminKey,
            @RequestBody RegisterRequest request
    ) {

        String result = authService.register(request, adminKey);

        if (result.equals("Username already exists")) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)   // 409
                    .body(result);
        }

        if (result.equals("Invalid role")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST) // 400
                    .body(result);
        }

        if (!result.equals("Registration successful")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(result);
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)        // 201
                .body(result);
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> registerWithDocuments(
            @RequestHeader(value = "X-ADMIN-KEY", required = false) String adminKey,
            @RequestPart("data") RegisterRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {

        String result = authService.register(request, documents, adminKey);

        if (result.equals("Username already exists")) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(result);
        }

        if (result.equals("Invalid role") || result.equals("Documents are required")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(result);
        }

        if (!result.equals("Registration successful")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(result);
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(result);
    }

    // ---------- TEST ----------
    @GetMapping("/register")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Auth API working");
    }

    // ---------- LOGIN ----------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        try {
            LoginResponse result = authService.login(request);
            return ResponseEntity.ok(result);      // 200
        } catch (RuntimeException ex) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED) // 401
                    .body(ex.getMessage());
        }
    }

    // ---------- CHANGE PASSWORD ----------
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            String result = authService.changePassword(request);
            if (!"Password changed".equals(result)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }
            return ResponseEntity.ok(result);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }
    
}
