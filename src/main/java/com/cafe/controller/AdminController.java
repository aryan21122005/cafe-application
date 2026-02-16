package com.cafe.controller;

import com.cafe.dto.AdminDecisionRequest;
import com.cafe.dto.AdminDocumentRow;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.AdminUserRow;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.AcademicInfo;
import com.cafe.entity.Address;
import com.cafe.entity.Document;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.User;
import com.cafe.entity.WorkExperience;
import com.cafe.repository.DocumentRepository;
import com.cafe.repository.UserRepository;
import com.cafe.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private EmailService emailService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserRow>> listUsers() {

        List<User> users = userRepository.findAll();

        List<AdminUserRow> rows = users.stream().map(u -> {
            AdminUserRow row = new AdminUserRow();
            row.setId(u.getId());
            row.setUsername(u.getUsername());
            row.setRole(u.getRole() == null ? null : u.getRole().name());
            row.setApprovalStatus(u.getApprovalStatus() == null ? null : u.getApprovalStatus().name());
            row.setEmail(u.getPersonalDetails() == null ? null : u.getPersonalDetails().getEmail());
            row.setPhone(u.getPersonalDetails() == null ? null : u.getPersonalDetails().getPhone());

            List<AdminDocumentRow> docs = new ArrayList<>();
            if (u.getDocuments() != null) {
                for (Document d : u.getDocuments()) {
                    if (d == null) continue;
                    AdminDocumentRow dr = new AdminDocumentRow();
                    dr.setId(d.getId());
                    dr.setDocumentName(d.getDocumentName());
                    dr.setDocumentType(d.getDocumentType());
                    dr.setSize(d.getSize());
                    docs.add(dr);
                }
            }
            row.setDocuments(docs);
            return row;
        }).toList();

        return ResponseEntity.ok(rows);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetail> getUserDetail(@PathVariable Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AdminUserDetail detail = new AdminUserDetail();
        detail.setId(u.getId());
        detail.setUsername(u.getUsername());
        detail.setRole(u.getRole() == null ? null : u.getRole().name());
        detail.setApprovalStatus(u.getApprovalStatus() == null ? null : u.getApprovalStatus().name());
        detail.setForcePasswordChange(u.getForcePasswordChange());

        PersonalDetails pd = u.getPersonalDetails();
        if (pd != null) {
            AdminUserDetail.PersonalDetailsDto pdd = new AdminUserDetail.PersonalDetailsDto();
            pdd.setId(pd.getId());
            pdd.setFirstName(pd.getFirstName());
            pdd.setLastName(pd.getLastName());
            pdd.setEmail(pd.getEmail());
            pdd.setPhone(pd.getPhone());
            pdd.setContactNo(pd.getContactNo());
            pdd.setGender(pd.getGender());
            pdd.setMaritalStatus(pd.getMaritalStatus());
            detail.setPersonalDetails(pdd);
        }

        Address a = u.getAddress();
        if (a != null) {
            AdminUserDetail.AddressDto ad = new AdminUserDetail.AddressDto();
            ad.setId(a.getId());
            ad.setStreet(a.getStreet());
            ad.setCity(a.getCity());
            ad.setState(a.getState());
            ad.setPincode(a.getPincode());
            detail.setAddress(ad);
        }

        List<AdminUserDetail.AcademicInfoDto> academics = new ArrayList<>();
        if (u.getAcademicInfoList() != null) {
            for (AcademicInfo ai : u.getAcademicInfoList()) {
                if (ai == null) continue;
                AdminUserDetail.AcademicInfoDto aid = new AdminUserDetail.AcademicInfoDto();
                aid.setId(ai.getId());
                aid.setInstitutionName(ai.getInstitutionName());
                aid.setDegree(ai.getDegree());
                aid.setPassingYear(ai.getPassingYear());
                aid.setGrade(ai.getGrade());
                aid.setGradeInPercentage(ai.getGradeInPercentage());
                academics.add(aid);
            }
        }
        detail.setAcademicInfoList(academics);

        List<AdminUserDetail.WorkExperienceDto> work = new ArrayList<>();
        if (u.getWorkExperienceList() != null) {
            for (WorkExperience we : u.getWorkExperienceList()) {
                if (we == null) continue;
                AdminUserDetail.WorkExperienceDto wed = new AdminUserDetail.WorkExperienceDto();
                wed.setId(we.getId());
                wed.setStartDate(we.getStartDate());
                wed.setEndDate(we.getEndDate());
                wed.setCurrentlyWorking(we.isCurrentlyWorking());
                wed.setCompanyName(we.getCompanyName());
                wed.setDesignation(we.getDesignation());
                wed.setCtc(we.getCtc());
                wed.setReasonForLeaving(we.getReasonForLeaving());
                work.add(wed);
            }
        }
        detail.setWorkExperienceList(work);

        List<AdminDocumentRow> docs = new ArrayList<>();
        if (u.getDocuments() != null) {
            for (Document d : u.getDocuments()) {
                if (d == null) continue;
                AdminDocumentRow dr = new AdminDocumentRow();
                dr.setId(d.getId());
                dr.setDocumentName(d.getDocumentName());
                dr.setDocumentType(d.getDocumentType());
                dr.setSize(d.getSize());
                docs.add(dr);
            }
        }
        detail.setDocuments(docs);

        return ResponseEntity.ok(detail);
    }

    @PostMapping("/users/{id}/approve")
    public ResponseEntity<String> approveUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String rawPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setForcePasswordChange(true);
        user.setApprovalStatus(ApprovalStatus.APPROVED);
        userRepository.save(user);

        String email = user.getPersonalDetails() == null ? null : user.getPersonalDetails().getEmail();
        log.info("Approved user id={} username={} email={}", user.getId(), user.getUsername(), email);
        if (emailService != null) {
            emailService.sendCredentials(email, user.getUsername(), rawPassword);
        } else {
            log.warn("EmailService bean not available; cannot send approval email");
        }

        return ResponseEntity.ok("Approved");
    }

    @PostMapping("/users/{id}/deny")
    public ResponseEntity<String> denyUser(@PathVariable Long id, @RequestBody(required = false) AdminDecisionRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setApprovalStatus(ApprovalStatus.DENIED);
        userRepository.save(user);

        String email = user.getPersonalDetails() == null ? null : user.getPersonalDetails().getEmail();
        log.info("Denied user id={} username={} email={} reason={}", user.getId(), user.getUsername(), email, request == null ? null : request.getReason());
        if (emailService != null) {
            emailService.sendDenied(email, request == null ? null : request.getReason());
        } else {
            log.warn("EmailService bean not available; cannot send denial email");
        }

        return ResponseEntity.ok("Denied");
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        String filename = doc.getDocumentName() == null ? ("document-" + id) : doc.getDocumentName();
        String contentType = doc.getDocumentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : doc.getDocumentType();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename.replace("\"", "") + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(doc.getData());
    }
}
