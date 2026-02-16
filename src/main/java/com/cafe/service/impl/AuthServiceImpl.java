package com.cafe.service.impl;

import com.cafe.dto.LoginRequest;
import com.cafe.dto.LoginResponse;
import com.cafe.dto.ChangePasswordRequest;
import com.cafe.dto.RegisterRequest;
import com.cafe.entity.Document;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.UserRepository;
import com.cafe.service.AuthService;
import com.cafe.service.EmailService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired(required = false)
    private EmailService emailService;

    @Value("${admin.registration.key:}")
    private String adminRegistrationKey;

    private String generateTempPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    private String generateUsername(RegisterRequest request) {
        String email = request.getPersonalDetails() == null ? null : request.getPersonalDetails().getEmail();
        String base = "user";
        if (email != null && !email.isBlank() && email.contains("@")) {
            base = email.substring(0, email.indexOf('@'));
        }

        base = base.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (base.isBlank()) {
            base = "user";
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

    // ---------- REGISTER ----------
    @Override
    @Transactional
    public String register(RegisterRequest request, String adminRegistrationKeyHeader) {

        Role role;
        try {
            role = Role.valueOf(request.getRole());
        } catch (Exception ex) {
            return "Invalid role";
        }

        boolean isPrivilegedRegistration = role == Role.ADMIN || role == Role.CHEF || role == Role.WAITER;
        if (isPrivilegedRegistration) {
            if (adminRegistrationKey == null || adminRegistrationKey.isBlank()) {
                return "Invalid role";
            }
            if (adminRegistrationKeyHeader == null || !adminRegistrationKey.equals(adminRegistrationKeyHeader)) {
                return "Invalid role";
            }
        } else if (!(role == Role.CUSTOMER || role == Role.OWNER)) {
            return "Invalid role";
        }

        if (request.getPersonalDetails() == null) {
            return "Personal details are required";
        }
        if (request.getPersonalDetails().getFirstName() == null || request.getPersonalDetails().getFirstName().isBlank()) {
            return "First name is required";
        }
        if (request.getPersonalDetails().getLastName() == null || request.getPersonalDetails().getLastName().isBlank()) {
            return "Last name is required";
        }
        if (request.getPersonalDetails().getEmail() == null || request.getPersonalDetails().getEmail().isBlank()) {
            return "Email is required";
        }
        if (request.getPersonalDetails().getPhone() == null || request.getPersonalDetails().getPhone().isBlank()) {
            return "Phone is required";
        }
        if (request.getAddress() == null) {
            return "Address is required";
        }
        if (request.getAddress().getStreet() == null || request.getAddress().getStreet().isBlank()) {
            return "Street is required";
        }
        if (request.getAddress().getCity() == null || request.getAddress().getCity().isBlank()) {
            return "City is required";
        }
        if (request.getAddress().getState() == null || request.getAddress().getState().isBlank()) {
            return "State is required";
        }
        if (request.getAddress().getPincode() == null || request.getAddress().getPincode().isBlank()) {
            return "Pincode is required";
        }

        if (userRepository.existsByPersonalDetailsEmail(request.getPersonalDetails().getEmail().trim())) {
            return "Email already exists";
        }
        if (userRepository.existsByPersonalDetailsPhone(request.getPersonalDetails().getPhone().trim())) {
            return "Phone already exists";
        }

        String username;
        if (isPrivilegedRegistration && request.getUsername() != null && !request.getUsername().isBlank()) {
            username = request.getUsername().trim();
        } else {
            username = generateUsername(request);
        }

        if (userRepository.findByUsername(username).isPresent()) {
            return "Username already exists";
        }

        boolean hasCustomPassword = isPrivilegedRegistration && request.getPassword() != null && !request.getPassword().isBlank();
        String rawPassword = hasCustomPassword ? request.getPassword() : generateTempPassword();

        User user = new User();

        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setForcePasswordChange(!hasCustomPassword);
        user.setApprovalStatus(isPrivilegedRegistration ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING);

        user.setPersonalDetails(request.getPersonalDetails());
        user.setAddress(request.getAddress());
        user.setAcademicInfoList(request.getAcademicInfoList());
        user.setWorkExperienceList(request.getWorkExperienceList());

        userRepository.save(user);

        return "Registration successful";
    }

    @Override
    @Transactional
    public String register(RegisterRequest request, List<MultipartFile> documents, String adminRegistrationKeyHeader) {

        if (documents == null || documents.isEmpty()) {
            return "Documents are required";
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole());
        } catch (Exception ex) {
            return "Invalid role";
        }

        boolean isPrivilegedRegistration = role == Role.ADMIN || role == Role.CHEF || role == Role.WAITER;
        if (isPrivilegedRegistration) {
            if (adminRegistrationKey == null || adminRegistrationKey.isBlank()) {
                return "Invalid role";
            }
            if (adminRegistrationKeyHeader == null || !adminRegistrationKey.equals(adminRegistrationKeyHeader)) {
                return "Invalid role";
            }
        } else if (!(role == Role.CUSTOMER || role == Role.OWNER)) {
            return "Invalid role";
        }

        if (request.getPersonalDetails() == null) {
            return "Personal details are required";
        }
        if (request.getPersonalDetails().getFirstName() == null || request.getPersonalDetails().getFirstName().isBlank()) {
            return "First name is required";
        }
        if (request.getPersonalDetails().getLastName() == null || request.getPersonalDetails().getLastName().isBlank()) {
            return "Last name is required";
        }
        if (request.getPersonalDetails().getEmail() == null || request.getPersonalDetails().getEmail().isBlank()) {
            return "Email is required";
        }
        if (request.getPersonalDetails().getPhone() == null || request.getPersonalDetails().getPhone().isBlank()) {
            return "Phone is required";
        }
        if (request.getAddress() == null) {
            return "Address is required";
        }
        if (request.getAddress().getStreet() == null || request.getAddress().getStreet().isBlank()) {
            return "Street is required";
        }
        if (request.getAddress().getCity() == null || request.getAddress().getCity().isBlank()) {
            return "City is required";
        }
        if (request.getAddress().getState() == null || request.getAddress().getState().isBlank()) {
            return "State is required";
        }
        if (request.getAddress().getPincode() == null || request.getAddress().getPincode().isBlank()) {
            return "Pincode is required";
        }

        if (userRepository.existsByPersonalDetailsEmail(request.getPersonalDetails().getEmail().trim())) {
            return "Email already exists";
        }
        if (userRepository.existsByPersonalDetailsPhone(request.getPersonalDetails().getPhone().trim())) {
            return "Phone already exists";
        }

        String username;
        if (isPrivilegedRegistration && request.getUsername() != null && !request.getUsername().isBlank()) {
            username = request.getUsername().trim();
        } else {
            username = generateUsername(request);
        }

        if (userRepository.findByUsername(username).isPresent()) {
            return "Username already exists";
        }

        boolean hasCustomPassword = isPrivilegedRegistration && request.getPassword() != null && !request.getPassword().isBlank();
        String rawPassword = hasCustomPassword ? request.getPassword() : generateTempPassword();

        User user = new User();

        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setForcePasswordChange(!hasCustomPassword);
        user.setApprovalStatus(isPrivilegedRegistration ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING);

        user.setPersonalDetails(request.getPersonalDetails());
        user.setAddress(request.getAddress());
        user.setAcademicInfoList(request.getAcademicInfoList());
        user.setWorkExperienceList(request.getWorkExperienceList());

        List<Document> docList = new ArrayList<>();

        for (MultipartFile file : documents) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            Document doc = new Document();
            doc.setDocumentName(file.getOriginalFilename());
            doc.setDocumentType(file.getContentType());
            doc.setSize(file.getSize());
            doc.setUser(user);

            try {
                doc.setData(file.getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to read uploaded document", e);
            }

            docList.add(doc);
        }

        if (docList.isEmpty()) {
            return "Documents are required";
        }

        user.setDocuments(docList);

        userRepository.save(user);

        return "Registration successful";
    }



    // ---------- LOGIN ----------
    @Override
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (user.getRole() != null && user.getRole() == Role.ADMIN) {
            if (user.getApprovalStatus() == null) {
                user.setApprovalStatus(ApprovalStatus.APPROVED);
                userRepository.save(user);
            }
        } else if (user.getApprovalStatus() != null && user.getApprovalStatus() != ApprovalStatus.APPROVED) {
            if (user.getApprovalStatus() == ApprovalStatus.DENIED) {
                throw new RuntimeException("Account denied by admin");
            }
            throw new RuntimeException("Account pending admin approval");
        }

        LoginResponse res = new LoginResponse();
        res.setUsername(user.getUsername());
        res.setRole(user.getRole() == null ? null : user.getRole().name());
        res.setForcePasswordChange(Boolean.TRUE.equals(user.getForcePasswordChange()));
        return res;
    }

    @Override
    @Transactional
    public String changePassword(ChangePasswordRequest request) {

        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return "Username required";
        }
        if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
            return "Old password required";
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            return "New password required";
        }
        if (request.getNewPassword().length() < 4) {
            return "Password too short";
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return "Invalid credentials";
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        return "Password changed";
    }
}
