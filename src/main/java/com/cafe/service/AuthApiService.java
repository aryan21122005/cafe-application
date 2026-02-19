package com.cafe.service;

import com.cafe.dto.ChangePasswordRequest;
import com.cafe.dto.LoginRequest;
import com.cafe.dto.RegisterRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AuthApiService {

    ResponseEntity<String> register(RegisterRequest request);

    ResponseEntity<String> registerWithDocuments(RegisterRequest request, List<MultipartFile> documents);

    ResponseEntity<?> login(LoginRequest request);

    ResponseEntity<?> changePassword(ChangePasswordRequest request);
}
