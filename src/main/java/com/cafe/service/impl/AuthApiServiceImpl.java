package com.cafe.service.impl;

import com.cafe.dto.ChangePasswordRequest;
import com.cafe.dto.LoginRequest;
import com.cafe.dto.LoginResponse;
import com.cafe.dto.RegisterRequest;
import com.cafe.service.AuthApiService;
import com.cafe.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class AuthApiServiceImpl implements AuthApiService {

    @Autowired
    private AuthService authService;

    @Override
    public ResponseEntity<String> register(RegisterRequest request) {
        try {
            String result = authService.register(request);

            if (result.equals("Username already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(result);
            }

            if (result.equals("Invalid role")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }

            if (!result.equals("Registration successful")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    @Override
    public ResponseEntity<String> registerWithDocuments(RegisterRequest request, List<MultipartFile> documents) {
        try {
            String result = authService.register(request, documents);

            if (result.equals("Username already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(result);
            }

            if (result.equals("Invalid role") || result.equals("Documents are required")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }

            if (!result.equals("Registration successful")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> login(LoginRequest request) {
        try {
            LoginResponse result = authService.login(request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> changePassword(ChangePasswordRequest request) {
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
