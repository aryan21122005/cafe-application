package com.cafe.controller;

import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/dev")
public class DevAdminController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${dev.admin.key:}")
    private String devAdminKey;

    public DevAdminController(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public static class DevAdminRegisterRequest {
        private String role;
        private String username;
        private String email;
        private String firstName;
        private String lastName;

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }
    }

    private String generateTempPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    private String generateUsername(DevAdminRegisterRequest request) {
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            return request.getUsername().trim();
        }

        String base = "admin";
        if (request.getEmail() != null && !request.getEmail().isBlank() && request.getEmail().contains("@")) {
            base = request.getEmail().substring(0, request.getEmail().indexOf('@'));
        }
        base = base.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (base.isBlank()) {
            base = "admin";
        }

        String candidate = base;
        int attempts = 0;
        while (userRepository.findByUsername(candidate).isPresent()) {
            attempts++;
            candidate = base + (int) (Math.random() * 10000);
            if (attempts > 25) {
                candidate = base + UUID.randomUUID().toString().replace("-", "").substring(0, 6);
                break;
            }
        }
        return candidate;
    }

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(
            @RequestHeader(value = "X-DEV-KEY", required = false) String devKey,
            @RequestBody DevAdminRegisterRequest request
    ) {
        if (devAdminKey == null || devAdminKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("dev.admin.key not configured");
        }

        if (devKey == null || !devAdminKey.equals(devKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid developer key");
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            if (!Role.ADMIN.name().equalsIgnoreCase(request.getRole().trim())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Only ADMIN role is allowed for this endpoint");
            }
        }

        String username = generateUsername(request);
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
        }

        String rawPassword = generateTempPassword();

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(Role.ADMIN);
        user.setForcePasswordChange(true);
        user.setApprovalStatus(ApprovalStatus.APPROVED);

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            PersonalDetails pd = new PersonalDetails();
            pd.setEmail(request.getEmail());
            pd.setFirstName(request.getFirstName());
            pd.setLastName(request.getLastName());
            user.setPersonalDetails(pd);
        }

        userRepository.save(user);

        Map<String, String> res = new HashMap<>();
        res.put("username", username);
        res.put("tempPassword", rawPassword);
        res.put("role", Role.ADMIN.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }
}
