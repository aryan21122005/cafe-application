package com.cafe.service;

import com.cafe.dto.LoginRequest;
import com.cafe.dto.LoginResponse;
import com.cafe.dto.ChangePasswordRequest;
import com.cafe.dto.RegisterRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AuthService {

    String register(RegisterRequest request);

    String register(RegisterRequest request, List<MultipartFile> documents);

    LoginResponse login(LoginRequest request);

    String changePassword(ChangePasswordRequest request);
}
