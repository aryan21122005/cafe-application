package com.cafe.service.impl;

import com.cafe.dto.AdminDecisionRequest;
import com.cafe.dto.AdminCafeRow;
import com.cafe.dto.AdminDocumentRow;
import com.cafe.dto.AdminOwnerRow;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.AdminUserRow;
import com.cafe.dto.CafeDocumentRow;
import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.RegisterRequest;
import com.cafe.entity.*;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.CafeImageRepository;
import com.cafe.repository.CafeDocumentRepository;
import com.cafe.repository.DocumentRepository;
import com.cafe.repository.FunctionCapacityRepository;
import com.cafe.repository.MenuItemRepository;
import com.cafe.repository.UserRepository;
import com.cafe.service.AdminService;
import com.cafe.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.web.multipart.MultipartFile;

@Service
public class AdminServiceImpl implements AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private CafeDocumentRepository cafeDocumentRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private FunctionCapacityRepository functionCapacityRepository;

    @Autowired
    private CafeImageRepository cafeImageRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private EmailService emailService;

    @Override
    public ResponseEntity<List<AdminUserRow>> listUsers() {
        try {
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
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private CafeDocumentRow toCafeDocumentRow(CafeDocument doc) {
        CafeDocumentRow r = new CafeDocumentRow();
        r.setId(doc.getId());
        r.setDocKey(doc.getDocKey());
        r.setDocumentName(doc.getDocumentName());
        r.setDocumentType(doc.getDocumentType());
        r.setSize(doc.getSize());
        return r;
    }

    @Override
    public ResponseEntity<List<CafeDocumentRow>> listCafeDocuments(Long cafeId) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            List<CafeDocument> docs = cafeDocumentRepository.findByCafeId(cafeId);
            List<CafeDocumentRow> rows = docs.stream().map(this::toCafeDocumentRow).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeDocumentRow> uploadCafeDocument(Long cafeId, String docKey, MultipartFile file) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (docKey == null || docKey.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (file == null || file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            CafeDocument doc = cafeDocumentRepository.findByCafeIdAndDocKey(cafeId, docKey.trim()).orElseGet(CafeDocument::new);
            doc.setCafe(cafe);
            doc.setDocKey(docKey.trim());
            doc.setDocumentName(file.getOriginalFilename());
            doc.setDocumentType(file.getContentType());
            doc.setSize(file.getSize());
            try {
                doc.setData(file.getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to read uploaded document", e);
            }
            cafeDocumentRepository.save(doc);

            return ResponseEntity.status(HttpStatus.CREATED).body(toCafeDocumentRow(doc));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<byte[]> downloadCafeDocument(Long id) {
        try {
            if (id == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeDocument doc = cafeDocumentRepository.findById(id).orElse(null);
            if (doc == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            String filename = doc.getDocumentName() == null ? ("cafe-document-" + id) : doc.getDocumentName();
            String contentType = doc.getDocumentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : doc.getDocumentType();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename.replace("\"", "") + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(doc.getData());
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> deleteCafe(Long cafeId) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cafe id is required");
            }

            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cafe not found");
            }

            if (cafe.getStaff() != null) {
                cafe.getStaff().clear();
                cafeRepository.save(cafe);
            }

            try {
                List<CafeImage> imgs = cafeImageRepository.findByCafeId(cafeId);
                for (CafeImage img : imgs) {
                    if (img == null) continue;
                    try {
                        if (img.getFilePath() != null && !img.getFilePath().isBlank()) {
                            Files.deleteIfExists(Path.of(img.getFilePath()));
                        }
                    } catch (Exception ignored) {
                    }
                }
                cafeImageRepository.deleteAll(imgs);
            } catch (RuntimeException ignored) {
            }

            try {
                List<FunctionCapacity> caps = functionCapacityRepository.findByCafeId(cafeId);
                functionCapacityRepository.deleteAll(caps);
            } catch (RuntimeException ignored) {
            }

            try {
                List<MenuItem> items = menuItemRepository.findByCafeId(cafeId);
                for (MenuItem mi : items) {
                    if (mi == null) continue;
                    try {
                        if (mi.getImageFilePath() != null && !mi.getImageFilePath().isBlank()) {
                            Files.deleteIfExists(Path.of(mi.getImageFilePath()));
                        }
                    } catch (Exception ignored) {
                    }
                }
                menuItemRepository.deleteAll(items);
            } catch (RuntimeException ignored) {
            }

            cafeRepository.deleteById(cafeId);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete cafe");
        }
    }

    @Override
    public ResponseEntity<List<AdminOwnerRow>> listOwners() {
        try {
            List<User> users = userRepository.findAll();
            List<AdminOwnerRow> rows = new ArrayList<>();
            for (User u : users) {
                if (u == null || u.getRole() != Role.OWNER) continue;
                AdminOwnerRow r = new AdminOwnerRow();
                r.setId(u.getId());
                r.setUsername(u.getUsername());
                r.setEmail(u.getPersonalDetails() == null ? null : u.getPersonalDetails().getEmail());
                r.setPhone(u.getPersonalDetails() == null ? null : u.getPersonalDetails().getPhone());
                r.setHasCafe(cafeRepository.findByOwnerUsername(u.getUsername()).isPresent());
                rows.add(r);
            }
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> createOwner(RegisterRequest request, List<MultipartFile> documents) {
        try {
            if (request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid request");
            }
            if (documents == null || documents.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Documents are required");
            }

            Role role;
            try {
                role = Role.valueOf(request.getRole());
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid role");
            }
            if (role != Role.OWNER) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid role");
            }

            if (request.getPersonalDetails() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Personal details are required");
            }
            if (request.getPersonalDetails().getFirstName() == null || request.getPersonalDetails().getFirstName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("First name is required");
            }
            if (request.getPersonalDetails().getLastName() == null || request.getPersonalDetails().getLastName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Last name is required");
            }
            if (request.getPersonalDetails().getEmail() == null || request.getPersonalDetails().getEmail().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is required");
            }
            if (request.getPersonalDetails().getPhone() == null || request.getPersonalDetails().getPhone().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Phone is required");
            }
            if (request.getAddress() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Address is required");
            }

            String email = request.getPersonalDetails().getEmail().trim();
            String phone = request.getPersonalDetails().getPhone().trim();
            if (userRepository.existsByPersonalDetailsEmail(email)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
            }
            if (userRepository.existsByPersonalDetailsPhone(phone)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Phone already exists");
            }

            String username;
            if (request.getUsername() != null && !request.getUsername().isBlank()) {
                username = request.getUsername().trim();
            } else {
                String base = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
                base = base.toLowerCase().replaceAll("[^a-z0-9]", "");
                if (base.isBlank()) base = "owner";
                username = base + "_owner";
            }
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
            }

            String rawPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 10);

            User owner = new User();
            owner.setUsername(username);
            owner.setPassword(passwordEncoder.encode(rawPassword));
            owner.setRole(Role.OWNER);
            owner.setForcePasswordChange(true);
            owner.setApprovalStatus(ApprovalStatus.APPROVED);
            owner.setPersonalDetails(request.getPersonalDetails());
            owner.setAddress(request.getAddress());
            owner.setAcademicInfoList(request.getAcademicInfoList());
            owner.setWorkExperienceList(request.getWorkExperienceList());

            List<Document> docList = new ArrayList<>();
            for (MultipartFile file : documents) {
                if (file == null || file.isEmpty()) continue;
                Document doc = new Document();
                doc.setDocumentName(file.getOriginalFilename());
                doc.setDocumentType(file.getContentType());
                doc.setSize(file.getSize());
                doc.setUser(owner);
                try {
                    doc.setData(file.getBytes());
                } catch (IOException e) {
                    throw new RuntimeException("Failed to read uploaded document", e);
                }
                docList.add(doc);
            }
            if (docList.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Documents are required");
            }
            owner.setDocuments(docList);

            userRepository.save(owner);

            try {
                if (emailService != null) {
                    emailService.sendCredentials(email, username, rawPassword);
                }
            } catch (RuntimeException ex) {
                log.warn("Failed to send owner credentials email username={} email={}", username, email, ex);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body("Owner created");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create owner");
        }
    }

    @Override
    public ResponseEntity<AdminCafeRow> createCafeForOwner(String ownerUsername, CafeProfileRequest request) {
        try {
            if (ownerUsername == null || ownerUsername.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getCafeName() == null || request.getCafeName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            User owner = userRepository.findByUsername(ownerUsername.trim()).orElse(null);
            if (owner == null || owner.getRole() != Role.OWNER) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (cafeRepository.findByOwnerUsername(owner.getUsername()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            Cafe cafe = new Cafe();
            cafe.setCafeName(request.getCafeName());
            cafe.setOwnerNames(request.getOwnerNames());
            cafe.setPocDesignation(request.getPocDesignation());
            cafe.setDescription(request.getDescription());
            cafe.setPhone(request.getPhone());
            cafe.setEmail(request.getEmail());
            cafe.setWhatsappNumber(request.getWhatsappNumber());
            cafe.setAddressLine(request.getAddressLine());
            cafe.setCity(request.getCity());
            cafe.setState(request.getState());
            cafe.setPincode(request.getPincode());
            cafe.setOpeningTime(request.getOpeningTime());
            cafe.setClosingTime(request.getClosingTime());
            cafe.setFssaiNumber(request.getFssaiNumber());
            cafe.setPanNumber(request.getPanNumber());
            cafe.setGstin(request.getGstin());
            cafe.setShopLicenseNumber(request.getShopLicenseNumber());
            cafe.setBankAccountNumber(request.getBankAccountNumber());
            cafe.setBankIfsc(request.getBankIfsc());
            cafe.setBankAccountHolderName(request.getBankAccountHolderName());
            cafe.setActive(request.getActive() == null ? true : request.getActive());
            cafe.setApprovalStatus(ApprovalStatus.APPROVED);
            cafe.setOwner(owner);
            cafeRepository.save(cafe);

            AdminCafeRow row = new AdminCafeRow();
            row.setId(cafe.getId());
            row.setCafeName(cafe.getCafeName());
            row.setActive(cafe.getActive());
            row.setApprovalStatus(cafe.getApprovalStatus() == null ? null : cafe.getApprovalStatus().name());
            row.setOwnerUsername(owner.getUsername());
            row.setCity(cafe.getCity());
            row.setState(cafe.getState());
            return ResponseEntity.status(HttpStatus.CREATED).body(row);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<MenuItemRow>> listCafeMenu(Long cafeId) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            List<MenuItem> items = menuItemRepository.findByCafeId(cafeId);
            List<MenuItemRow> rows = items.stream().map(mi -> {
                MenuItemRow r = new MenuItemRow();
                r.setId(mi.getId());
                r.setName(mi.getName());
                r.setDescription(mi.getDescription());
                r.setPrice(mi.getPrice());
                r.setAvailable(mi.getAvailable());
                r.setCategory(mi.getCategory());
                if (mi.getImageFilePath() != null && !mi.getImageFilePath().isBlank()) {
                    r.setImageUrl("/api/public/menu-images/" + mi.getId());
                }
                return r;
            }).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<AdminCafeRow>> listCafes() {
        try {
            List<Cafe> cafes = cafeRepository.findAll();
            List<AdminCafeRow> rows = cafes.stream().map(c -> {
                AdminCafeRow r = new AdminCafeRow();
                r.setId(c.getId());
                r.setCafeName(c.getCafeName());
                r.setActive(c.getActive());
                r.setApprovalStatus(c.getApprovalStatus() == null ? null : c.getApprovalStatus().name());
                r.setOwnerUsername(c.getOwner() == null ? null : c.getOwner().getUsername());
                r.setCity(c.getCity());
                r.setState(c.getState());
                return r;
            }).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeProfileResponse> getCafeDetail(Long cafeId) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.ok(toCafeResponse(cafe));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<AdminCafeRow> approveCafe(Long cafeId) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            cafe.setApprovalStatus(ApprovalStatus.APPROVED);
            cafeRepository.save(cafe);

            AdminCafeRow r = new AdminCafeRow();
            r.setId(cafe.getId());
            r.setCafeName(cafe.getCafeName());
            r.setActive(cafe.getActive());
            r.setApprovalStatus(cafe.getApprovalStatus() == null ? null : cafe.getApprovalStatus().name());
            r.setOwnerUsername(cafe.getOwner() == null ? null : cafe.getOwner().getUsername());
            r.setCity(cafe.getCity());
            r.setState(cafe.getState());
            return ResponseEntity.ok(r);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private CafeProfileResponse toCafeResponse(Cafe cafe) {
        CafeProfileResponse r = new CafeProfileResponse();
        r.setId(cafe.getId());
        r.setCafeName(cafe.getCafeName());
        r.setOwnerNames(cafe.getOwnerNames());
        r.setPocDesignation(cafe.getPocDesignation());
        r.setDescription(cafe.getDescription());
        r.setPhone(cafe.getPhone());
        r.setEmail(cafe.getEmail());
        r.setWhatsappNumber(cafe.getWhatsappNumber());
        r.setAddressLine(cafe.getAddressLine());
        r.setCity(cafe.getCity());
        r.setState(cafe.getState());
        r.setPincode(cafe.getPincode());
        r.setOpeningTime(cafe.getOpeningTime());
        r.setClosingTime(cafe.getClosingTime());
        r.setFssaiNumber(cafe.getFssaiNumber());
        r.setPanNumber(cafe.getPanNumber());
        r.setGstin(cafe.getGstin());
        r.setShopLicenseNumber(cafe.getShopLicenseNumber());
        r.setBankAccountNumber(cafe.getBankAccountNumber());
        r.setBankIfsc(cafe.getBankIfsc());
        r.setBankAccountHolderName(cafe.getBankAccountHolderName());
        r.setActive(cafe.getActive());
        r.setApprovalStatus(cafe.getApprovalStatus() == null ? null : cafe.getApprovalStatus().name());
        r.setOwnerUsername(cafe.getOwner() == null ? null : cafe.getOwner().getUsername());
        return r;
    }

    @Override
    public ResponseEntity<AdminUserDetail> getUserDetail(Long id) {
        try {
            User u = userRepository.findById(id).orElse(null);
            if (u == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

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
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> approveUser(Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

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
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to approve");
        }
    }

    @Override
    public ResponseEntity<String> denyUser(Long id, AdminDecisionRequest request) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

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
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to deny");
        }
    }

    @Override
    public ResponseEntity<String> deleteUser(Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            if (user.getRole() == Role.ADMIN) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot delete admin user");
            }

            Cafe ownedCafe = cafeRepository.findByOwnerUsername(user.getUsername()).orElse(null);
            if (ownedCafe != null && ownedCafe.getOwner() != null && ownedCafe.getOwner().getId() != null && ownedCafe.getOwner().getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot delete owner with a cafe");
            }

            List<Cafe> cafes = cafeRepository.findAll();
            for (Cafe cafe : cafes) {
                if (cafe == null || cafe.getStaff() == null) continue;
                boolean removed = cafe.getStaff().removeIf(u -> u != null && u.getId() != null && u.getId().equals(id));
                if (removed) {
                    cafeRepository.save(cafe);
                }
            }

            userRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete");
        }
    }

    @Override
    public ResponseEntity<byte[]> downloadDocument(Long id) {
        try {
            Document doc = documentRepository.findById(id).orElse(null);
            if (doc == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            String filename = doc.getDocumentName() == null ? ("document-" + id) : doc.getDocumentName();
            String contentType = doc.getDocumentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : doc.getDocumentType();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename.replace("\"", "") + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(doc.getData());
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
