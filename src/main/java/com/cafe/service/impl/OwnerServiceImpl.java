package com.cafe.service.impl;

import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.CafeImageRow;
import com.cafe.dto.FunctionCapacityRequest;
import com.cafe.dto.FunctionCapacityRow;
import com.cafe.dto.MenuItemRequest;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.OwnerStaffCreateRequest;
import com.cafe.dto.OwnerStaffRow;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeImage;
import com.cafe.entity.FunctionCapacity;
import com.cafe.entity.FunctionType;
import com.cafe.entity.MenuItem;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.entity.Address;
import com.cafe.entity.Document;
import com.cafe.entity.WorkExperience;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.CafeImageRepository;
import com.cafe.repository.FunctionCapacityRepository;
import com.cafe.repository.MenuItemRepository;
import com.cafe.repository.UserRepository;
import com.cafe.service.EmailService;
import com.cafe.service.OwnerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
public class OwnerServiceImpl implements OwnerService {

    private static final Logger log = LoggerFactory.getLogger(OwnerServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CafeRepository cafeRepository;

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

    @Value("${cafe.images.dir:uploads/cafe-images}")
    private String cafeImagesDir;

    private String generateTempPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    private User requireOwner(String ownerUsername) {
        if (ownerUsername == null || ownerUsername.isBlank()) {
            return null;
        }
        User owner = userRepository.findByUsername(ownerUsername.trim()).orElse(null);
        if (owner == null) {
            return null;
        }
        if (owner.getRole() == null || owner.getRole() != Role.OWNER) {
            return null;
        }
        return owner;
    }

    private CafeProfileResponse toCafeResponse(Cafe cafe) {
        CafeProfileResponse res = new CafeProfileResponse();
        res.setId(cafe.getId());
        res.setCafeName(cafe.getCafeName());
        res.setDescription(cafe.getDescription());
        res.setPhone(cafe.getPhone());
        res.setEmail(cafe.getEmail());
        res.setAddressLine(cafe.getAddressLine());
        res.setCity(cafe.getCity());
        res.setState(cafe.getState());
        res.setPincode(cafe.getPincode());
        res.setOpeningTime(cafe.getOpeningTime());
        res.setClosingTime(cafe.getClosingTime());
        res.setActive(cafe.getActive());
        res.setOwnerUsername(cafe.getOwner() == null ? null : cafe.getOwner().getUsername());
        return res;
    }

    private Cafe requireCafe(User owner) {
        if (owner == null) return null;
        return cafeRepository.findByOwnerUsername(owner.getUsername()).orElse(null);
    }

    private MenuItemRow toMenuRow(MenuItem m) {
        MenuItemRow r = new MenuItemRow();
        r.setId(m.getId());
        r.setName(m.getName());
        r.setDescription(m.getDescription());
        r.setPrice(m.getPrice());
        r.setAvailable(m.getAvailable());
        r.setCategory(m.getCategory());
        return r;
    }

    private FunctionCapacityRow toCapacityRow(FunctionCapacity c) {
        FunctionCapacityRow r = new FunctionCapacityRow();
        r.setId(c.getId());
        r.setFunctionType(c.getFunctionType() == null ? null : c.getFunctionType().name());
        r.setTablesAvailable(c.getTablesAvailable());
        r.setSeatsAvailable(c.getSeatsAvailable());
        r.setPrice(c.getPrice());
        r.setEnabled(c.getEnabled());
        return r;
    }

    private CafeImageRow toImageRow(CafeImage img) {
        CafeImageRow r = new CafeImageRow();
        r.setId(img.getId());
        r.setFilename(img.getFilename());
        r.setContentType(img.getContentType());
        r.setSize(img.getSize());
        r.setCover(img.getCover());
        r.setUrl("/api/public/cafe-images/" + img.getId());
        return r;
    }

    @Override
    public ResponseEntity<CafeProfileResponse> getCafe(String ownerUsername) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Cafe cafe = cafeRepository.findByOwnerUsername(owner.getUsername()).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            return ResponseEntity.ok(toCafeResponse(cafe));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeProfileResponse> upsertCafe(String ownerUsername, CafeProfileRequest request) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (request == null || request.getCafeName() == null || request.getCafeName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Cafe cafe = cafeRepository.findByOwnerUsername(owner.getUsername()).orElseGet(Cafe::new);
            cafe.setOwner(owner);
            cafe.setCafeName(request.getCafeName().trim());
            cafe.setDescription(request.getDescription());
            cafe.setPhone(request.getPhone());
            cafe.setEmail(request.getEmail());
            cafe.setAddressLine(request.getAddressLine());
            cafe.setCity(request.getCity());
            cafe.setState(request.getState());
            cafe.setPincode(request.getPincode());
            cafe.setOpeningTime(request.getOpeningTime());
            cafe.setClosingTime(request.getClosingTime());
            if (request.getActive() != null) {
                cafe.setActive(request.getActive());
            }

            cafeRepository.save(cafe);
            return ResponseEntity.ok(toCafeResponse(cafe));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<OwnerStaffRow>> listStaff(String ownerUsername) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Cafe cafe = cafeRepository.findByOwnerUsername(owner.getUsername()).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            List<OwnerStaffRow> rows = new ArrayList<>();
            if (cafe.getStaff() != null) {
                for (User u : cafe.getStaff()) {
                    if (u == null) continue;
                    OwnerStaffRow r = new OwnerStaffRow();
                    r.setId(u.getId());
                    r.setUsername(u.getUsername());
                    r.setRole(u.getRole() == null ? null : u.getRole().name());
                    r.setApprovalStatus(u.getApprovalStatus() == null ? null : u.getApprovalStatus().name());
                    r.setEmail(u.getPersonalDetails() == null ? null : u.getPersonalDetails().getEmail());
                    r.setPhone(u.getPersonalDetails() == null ? null : u.getPersonalDetails().getPhone());
                    rows.add(r);
                }
            }

            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> createStaff(String ownerUsername, OwnerStaffCreateRequest request) {
        return createStaffInternal(ownerUsername, request, null);
    }

    @Override
    public ResponseEntity<String> createStaffWithDocuments(String ownerUsername, OwnerStaffCreateRequest request, List<MultipartFile> documents) {
        return createStaffInternal(ownerUsername, request, documents);
    }

    private ResponseEntity<String> createStaffInternal(String ownerUsername, OwnerStaffCreateRequest request, List<MultipartFile> documents) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not an owner");
            }

            Cafe cafe = cafeRepository.findByOwnerUsername(owner.getUsername()).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Create cafe profile first");
            }

            if (request == null || request.getRole() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid role");
            }

            Role role;
            try {
                role = Role.valueOf(request.getRole());
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid role");
            }

            if (!(role == Role.CHEF || role == Role.WAITER)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid role");
            }

            if (request.getPersonalDetails() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Personal details are required");
            }
            PersonalDetails pd = request.getPersonalDetails();
            if (pd.getFirstName() == null || pd.getFirstName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("First name is required");
            }
            if (pd.getLastName() == null || pd.getLastName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Last name is required");
            }
            if (pd.getEmail() == null || pd.getEmail().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is required");
            }
            if (pd.getPhone() == null || pd.getPhone().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Phone is required");
            }

            if (request.getAddress() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Address is required");
            }
            Address address = request.getAddress();
            if (address.getStreet() == null || address.getStreet().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Street is required");
            }
            if (address.getCity() == null || address.getCity().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("City is required");
            }
            if (address.getState() == null || address.getState().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("State is required");
            }
            if (address.getPincode() == null || address.getPincode().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Pincode is required");
            }

            String email = pd.getEmail().trim();
            String phone = pd.getPhone().trim();
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
                if (base.isBlank()) base = role.name().toLowerCase();
                username = base + "_" + role.name().toLowerCase();
            }

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
            }

            boolean hasCustomPassword = request.getPassword() != null && !request.getPassword().isBlank();
            String rawPassword = hasCustomPassword ? request.getPassword() : generateTempPassword();

            if (documents != null) {
                boolean any = false;
                for (MultipartFile f : documents) {
                    if (f != null && !f.isEmpty()) {
                        any = true;
                        break;
                    }
                }
                if (!any) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Documents are required");
                }
            }

            User staff = new User();
            staff.setUsername(username);
            staff.setPassword(passwordEncoder.encode(rawPassword));
            staff.setRole(role);
            staff.setApprovalStatus(ApprovalStatus.APPROVED);
            staff.setForcePasswordChange(!hasCustomPassword);
            staff.setPersonalDetails(pd);
            staff.setAddress(address);
            staff.setAcademicInfoList(request.getAcademicInfoList());
            staff.setWorkExperienceList(request.getWorkExperienceList());

            if (documents != null) {
                List<Document> docList = new ArrayList<>();
                for (MultipartFile file : documents) {
                    if (file == null || file.isEmpty()) {
                        continue;
                    }
                    Document doc = new Document();
                    doc.setDocumentName(file.getOriginalFilename());
                    doc.setDocumentType(file.getContentType());
                    doc.setSize(file.getSize());
                    doc.setUser(staff);
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
                staff.setDocuments(docList);
            }

            userRepository.save(staff);

            try {
                if (emailService == null) {
                    log.warn("EmailService bean not available; cannot send staff credentials email username={} email={}", username, email);
                } else {
                    log.info("Sending staff credentials email username={} email={} role={} hasCustomPassword={}", username, email, role, hasCustomPassword);
                    emailService.sendCredentials(email, username, rawPassword);
                    log.info("Staff credentials email send invoked username={} email={}", username, email);
                }
            } catch (RuntimeException ex) {
                log.warn("Failed to send staff credentials email username={} email={}", username, email, ex);
            }

            if (cafe.getStaff() == null) {
                cafe.setStaff(new ArrayList<>());
            }
            cafe.getStaff().add(staff);
            cafeRepository.save(cafe);

            if (hasCustomPassword) {
                return ResponseEntity.status(HttpStatus.CREATED).body("Staff created");
            }
            return ResponseEntity.status(HttpStatus.CREATED).body("Staff created. Temporary password: " + rawPassword);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create staff");
        }
    }

    @Override
    public ResponseEntity<String> deleteStaff(String ownerUsername, Long id) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not an owner");
            }

            Cafe cafe = cafeRepository.findByOwnerUsername(owner.getUsername()).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Create cafe profile first");
            }

            User staff = userRepository.findById(id).orElse(null);
            if (staff == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            if (staff.getRole() == null || !(staff.getRole() == Role.CHEF || staff.getRole() == Role.WAITER)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Not a staff user");
            }

            if (cafe.getStaff() != null) {
                cafe.getStaff().removeIf(u -> u != null && u.getId() != null && u.getId().equals(id));
                cafeRepository.save(cafe);
            }

            userRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete");
        }
    }

    @Override
    public ResponseEntity<List<MenuItemRow>> listMenu(String ownerUsername) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            List<MenuItem> items = menuItemRepository.findByCafeId(cafe.getId());
            List<MenuItemRow> rows = items.stream().map(this::toMenuRow).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<MenuItemRow> createMenuItem(String ownerUsername, MenuItemRequest request) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getName() == null || request.getName().isBlank() || request.getPrice() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            MenuItem m = new MenuItem();
            m.setCafe(cafe);
            m.setName(request.getName().trim());
            m.setDescription(request.getDescription());
            m.setPrice(request.getPrice());
            m.setAvailable(request.getAvailable() == null ? true : request.getAvailable());
            m.setCategory(request.getCategory());
            menuItemRepository.save(m);

            return ResponseEntity.status(HttpStatus.CREATED).body(toMenuRow(m));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<MenuItemRow> updateMenuItem(String ownerUsername, Long id, MenuItemRequest request) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            MenuItem m = menuItemRepository.findById(id).orElse(null);
            if (m == null || m.getCafe() == null || !m.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            if (request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request.getName() != null && !request.getName().isBlank()) {
                m.setName(request.getName().trim());
            }
            if (request.getDescription() != null) {
                m.setDescription(request.getDescription());
            }
            if (request.getPrice() != null) {
                m.setPrice(request.getPrice());
            }
            if (request.getAvailable() != null) {
                m.setAvailable(request.getAvailable());
            }
            if (request.getCategory() != null) {
                m.setCategory(request.getCategory());
            }
            menuItemRepository.save(m);
            return ResponseEntity.ok(toMenuRow(m));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> deleteMenuItem(String ownerUsername, Long id) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not an owner");
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Create cafe profile first");
            }
            MenuItem m = menuItemRepository.findById(id).orElse(null);
            if (m == null || m.getCafe() == null || !m.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
            }
            menuItemRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete");
        }
    }

    @Override
    public ResponseEntity<List<FunctionCapacityRow>> listCapacities(String ownerUsername) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            List<FunctionCapacity> caps = functionCapacityRepository.findByCafeId(cafe.getId());
            List<FunctionCapacityRow> rows = caps.stream().map(this::toCapacityRow).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<FunctionCapacityRow> upsertCapacity(String ownerUsername, FunctionCapacityRequest request) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getFunctionType() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            FunctionType ft;
            try {
                ft = FunctionType.valueOf(request.getFunctionType());
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Integer tables = request.getTablesAvailable();
            if (tables == null || tables < 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            FunctionCapacity cap = functionCapacityRepository.findByCafeIdAndFunctionType(cafe.getId(), ft).orElseGet(FunctionCapacity::new);
            cap.setCafe(cafe);
            cap.setFunctionType(ft);
            cap.setTablesAvailable(tables);
            cap.setSeatsAvailable(request.getSeatsAvailable());
            cap.setPrice(request.getPrice());
            cap.setEnabled(request.getEnabled() == null ? true : request.getEnabled());

            functionCapacityRepository.save(cap);
            return ResponseEntity.ok(toCapacityRow(cap));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> deleteCapacity(String ownerUsername, Long id) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not an owner");
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Create cafe profile first");
            }
            FunctionCapacity cap = functionCapacityRepository.findById(id).orElse(null);
            if (cap == null || cap.getCafe() == null || !cap.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
            }
            functionCapacityRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete");
        }
    }

    @Override
    public ResponseEntity<List<CafeImageRow>> listImages(String ownerUsername) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            List<CafeImage> images = cafeImageRepository.findByCafeId(cafe.getId());
            List<CafeImageRow> rows = images.stream().map(this::toImageRow).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeImageRow> uploadImage(String ownerUsername, MultipartFile file, Boolean cover) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            if (file == null || file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Files.createDirectories(Path.of(cafeImagesDir));

            String orig = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
            String safe = orig.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedName = UUID.randomUUID() + "_" + safe;
            Path target = Path.of(cafeImagesDir).resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            CafeImage img = new CafeImage();
            img.setCafe(cafe);
            img.setFilename(orig);
            img.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
            img.setFilePath(target.toAbsolutePath().toString());
            img.setSize(file.getSize());
            img.setCover(Boolean.TRUE.equals(cover));
            cafeImageRepository.save(img);

            return ResponseEntity.status(HttpStatus.CREATED).body(toImageRow(img));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> deleteImage(String ownerUsername, Long id) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not an owner");
            }
            Cafe cafe = requireCafe(owner);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Create cafe profile first");
            }
            CafeImage img = cafeImageRepository.findById(id).orElse(null);
            if (img == null || img.getCafe() == null || !img.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
            }

            try {
                Files.deleteIfExists(Path.of(img.getFilePath()));
            } catch (Exception ignored) {
            }

            cafeImageRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete");
        }
    }
}
