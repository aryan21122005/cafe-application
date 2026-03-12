package com.cafe.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cafe.dto.AdminAnalyticsDetailsResponse;
import com.cafe.dto.AdminAnalyticsSummary;
import com.cafe.dto.AdminCafeMetricRow;
import com.cafe.dto.AdminCafeRow;
import com.cafe.dto.AdminCityMetricRow;
import com.cafe.dto.AdminDecisionRequest;
import com.cafe.dto.AdminDocumentRow;
import com.cafe.dto.AdminHourMetricRow;
import com.cafe.dto.AdminItemMetricRow;
import com.cafe.dto.AdminOwnerRow;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.AdminUserRow;
import com.cafe.dto.CafeDocumentRow;
import com.cafe.dto.CafeImageRow;
import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.MenuAvailabilityRequest;
import com.cafe.dto.MenuItemRequest;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.RegisterRequest;
import com.cafe.entity.AcademicInfo;
import com.cafe.entity.Address;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeBooking;
import com.cafe.entity.CafeDocument;
import com.cafe.entity.CafeImage;
import com.cafe.entity.CafeOrder;
import com.cafe.entity.CafeOrderItem;
import com.cafe.entity.Document;
import com.cafe.entity.FunctionCapacity;
import com.cafe.entity.MenuItem;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.entity.WorkExperience;
import com.cafe.repository.CafeBookingRepository;
import com.cafe.repository.CafeDocumentRepository;
import com.cafe.repository.CafeImageRepository;
import com.cafe.repository.CafeOrderRepository;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.DocumentRepository;
import com.cafe.repository.FunctionCapacityRepository;
import com.cafe.repository.MenuItemRepository;
import com.cafe.repository.UserRepository;
import com.cafe.service.AdminService;
import com.cafe.service.EmailService;

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
    private CafeOrderRepository cafeOrderRepository;

    @Autowired
    private CafeBookingRepository cafeBookingRepository;

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

    @Value("${menu.images.dir:uploads/menu-images}")
    private String menuImagesDir;

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

    private MenuItemRow toMenuRow(MenuItem mi) {
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
    }

    @Override
    public ResponseEntity<MenuItemRow> createCafeMenuItem(Long cafeId, MenuItemRequest request) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getName() == null || request.getName().isBlank() || request.getPrice() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
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
    public ResponseEntity<MenuItemRow> updateCafeMenuItem(Long cafeId, Long menuItemId, MenuItemRequest request) {
        try {
            if (cafeId == null || menuItemId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            MenuItem m = menuItemRepository.findById(menuItemId).orElse(null);
            if (m == null || m.getCafe() == null || !m.getCafe().getId().equals(cafeId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
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
    public ResponseEntity<MenuItemRow> updateCafeMenuItemAvailability(Long cafeId, Long menuItemId, MenuAvailabilityRequest request) {
        try {
            if (cafeId == null || menuItemId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getAvailable() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            MenuItem m = menuItemRepository.findById(menuItemId).orElse(null);
            if (m == null || m.getCafe() == null || !m.getCafe().getId().equals(cafeId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            m.setAvailable(request.getAvailable());
            menuItemRepository.save(m);
            return ResponseEntity.ok(toMenuRow(m));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<MenuItemRow> uploadCafeMenuItemImage(Long cafeId, Long menuItemId, MultipartFile file) {
        try {
            if (cafeId == null || menuItemId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (file == null || file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            MenuItem m = menuItemRepository.findById(menuItemId).orElse(null);
            if (m == null || m.getCafe() == null || !m.getCafe().getId().equals(cafeId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            try {
                if (m.getImageFilePath() != null && !m.getImageFilePath().isBlank()) {
                    Files.deleteIfExists(Path.of(m.getImageFilePath()));
                }
            } catch (Exception ignored) {
            }

            Files.createDirectories(Path.of(menuImagesDir));

            String orig = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
            String safe = orig.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedName = UUID.randomUUID() + "_" + safe;
            Path target = Path.of(menuImagesDir).resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            m.setImageFilename(orig);
            m.setImageContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
            m.setImageFilePath(target.toAbsolutePath().toString());
            m.setImageSize(file.getSize());
            menuItemRepository.save(m);

            return ResponseEntity.ok(toMenuRow(m));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> deleteCafeMenuItem(Long cafeId, Long menuItemId) {
        try {
            if (cafeId == null || menuItemId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Bad request");
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cafe not found");
            }

            MenuItem m = menuItemRepository.findById(menuItemId).orElse(null);
            if (m == null || m.getCafe() == null || !m.getCafe().getId().equals(cafeId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
            }

            try {
                if (m.getImageFilePath() != null && !m.getImageFilePath().isBlank()) {
                    Files.deleteIfExists(Path.of(m.getImageFilePath()));
                }
            } catch (Exception ignored) {
            }
            menuItemRepository.deleteById(menuItemId);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete");
        }
    }

    @Override
    public ResponseEntity<byte[]> exportCafeHistoryExcel(Long cafeId) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            List<CafeOrder> orders = cafeOrderRepository.findByCafeIdOrderByCreatedAtDesc(cafeId);
            List<CafeBooking> bookings = cafeBookingRepository.findByCafeIdOrderByCreatedAtDesc(cafeId);

            try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                Sheet sOrders = wb.createSheet("Orders");
                int r = 0;

                Row h = sOrders.createRow(r++);
                int c = 0;
                h.createCell(c++).setCellValue("OrderId");
                h.createCell(c++).setCellValue("OrderNumber");
                h.createCell(c++).setCellValue("CreatedAt");
                h.createCell(c++).setCellValue("Status");
                h.createCell(c++).setCellValue("CustomerUsername");
                h.createCell(c++).setCellValue("CustomerName");
                h.createCell(c++).setCellValue("CustomerPhone");
                h.createCell(c++).setCellValue("AllocatedTable");
                h.createCell(c++).setCellValue("AmenityPreference");
                h.createCell(c++).setCellValue("TotalAmount");

                if (orders != null) {
                    for (CafeOrder o : orders) {
                        if (o == null) continue;
                        Row rr = sOrders.createRow(r++);
                        int cc = 0;
                        rr.createCell(cc++).setCellValue(o.getId() == null ? 0 : o.getId());
                        rr.createCell(cc++).setCellValue(o.getOrderNumber() == null ? 0 : o.getOrderNumber());
                        rr.createCell(cc++).setCellValue(o.getCreatedAt() == null ? 0 : o.getCreatedAt());
                        rr.createCell(cc++).setCellValue(o.getStatus() == null ? "" : o.getStatus());
                        rr.createCell(cc++).setCellValue(o.getCustomerUsername() == null ? "" : o.getCustomerUsername());
                        rr.createCell(cc++).setCellValue(o.getCustomerName() == null ? "" : o.getCustomerName());
                        rr.createCell(cc++).setCellValue(o.getCustomerPhone() == null ? "" : o.getCustomerPhone());
                        rr.createCell(cc++).setCellValue(o.getAllocatedTable() == null ? "" : o.getAllocatedTable());
                        rr.createCell(cc++).setCellValue(o.getAmenityPreference() == null ? "" : o.getAmenityPreference());
                        rr.createCell(cc++).setCellValue(o.getTotalAmount() == null ? 0.0 : o.getTotalAmount());
                    }
                }
                for (int i = 0; i < 10; i++) sOrders.autoSizeColumn(i);

                Sheet sBookings = wb.createSheet("Bookings");
                int br = 0;
                Row bh = sBookings.createRow(br++);
                int bc = 0;
                bh.createCell(bc++).setCellValue("BookingId");
                bh.createCell(bc++).setCellValue("CreatedAt");
                bh.createCell(bc++).setCellValue("Status");
                bh.createCell(bc++).setCellValue("CustomerUsername");
                bh.createCell(bc++).setCellValue("CustomerName");
                bh.createCell(bc++).setCellValue("CustomerPhone");
                bh.createCell(bc++).setCellValue("BookingDate");
                bh.createCell(bc++).setCellValue("BookingTime");
                bh.createCell(bc++).setCellValue("Guests");
                bh.createCell(bc++).setCellValue("AllocatedTable");
                bh.createCell(bc++).setCellValue("AmenityPreference");
                bh.createCell(bc++).setCellValue("DenialReason");

                if (bookings != null) {
                    for (CafeBooking b : bookings) {
                        if (b == null) continue;
                        Row rr = sBookings.createRow(br++);
                        int cc = 0;
                        rr.createCell(cc++).setCellValue(b.getId() == null ? 0 : b.getId());
                        rr.createCell(cc++).setCellValue(b.getCreatedAt() == null ? 0 : b.getCreatedAt());
                        rr.createCell(cc++).setCellValue(b.getStatus() == null ? "" : b.getStatus());
                        rr.createCell(cc++).setCellValue(b.getCustomerUsername() == null ? "" : b.getCustomerUsername());
                        rr.createCell(cc++).setCellValue(b.getCustomerName() == null ? "" : b.getCustomerName());
                        rr.createCell(cc++).setCellValue(b.getCustomerPhone() == null ? "" : b.getCustomerPhone());
                        rr.createCell(cc++).setCellValue(b.getBookingDate() == null ? "" : b.getBookingDate());
                        rr.createCell(cc++).setCellValue(b.getBookingTime() == null ? "" : b.getBookingTime());
                        rr.createCell(cc++).setCellValue(b.getGuests() == null ? 0 : b.getGuests());
                        rr.createCell(cc++).setCellValue(b.getAllocatedTable() == null ? "" : b.getAllocatedTable());
                        rr.createCell(cc++).setCellValue(b.getAmenityPreference() == null ? "" : b.getAmenityPreference());
                        rr.createCell(cc++).setCellValue(b.getDenialReason() == null ? "" : b.getDenialReason());
                    }
                }
                for (int i = 0; i < 12; i++) sBookings.autoSizeColumn(i);

                wb.write(bos);
                byte[] bytes = bos.toByteArray();

                String safeName = (cafe.getCafeName() == null ? "cafe" : cafe.getCafeName()).replaceAll("[^a-zA-Z0-9-_]+", "_");
                String filename = safeName + "-history.xlsx";
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(bytes);
            } catch (IOException io) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<byte[]> exportCafeMenuExcel(Long cafeId) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            List<MenuItem> menu = menuItemRepository.findByCafeId(cafeId);

            try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                Sheet s = wb.createSheet("Menu");
                int r = 0;
                Row h = s.createRow(r++);
                int c = 0;
                h.createCell(c++).setCellValue("MenuItemId");
                h.createCell(c++).setCellValue("Name");
                h.createCell(c++).setCellValue("Category");
                h.createCell(c++).setCellValue("Price");
                h.createCell(c++).setCellValue("Available");

                if (menu != null) {
                    for (MenuItem mi : menu) {
                        if (mi == null) continue;
                        Row rr = s.createRow(r++);
                        int cc = 0;
                        rr.createCell(cc++).setCellValue(mi.getId() == null ? 0 : mi.getId());
                        rr.createCell(cc++).setCellValue(mi.getName() == null ? "" : mi.getName());
                        rr.createCell(cc++).setCellValue(mi.getCategory() == null ? "" : mi.getCategory());
                        rr.createCell(cc++).setCellValue(mi.getPrice() == null ? 0.0 : mi.getPrice());
                        rr.createCell(cc++).setCellValue(mi.getAvailable() == null ? "" : String.valueOf(mi.getAvailable()));
                    }
                }

                for (int i = 0; i < 5; i++) s.autoSizeColumn(i);
                wb.write(bos);
                byte[] bytes = bos.toByteArray();

                String safeName = (cafe.getCafeName() == null ? "cafe" : cafe.getCafeName()).replaceAll("[^a-zA-Z0-9-_]+", "_");
                String filename = safeName + "-menu.xlsx";
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(bytes);
            } catch (IOException io) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<AdminAnalyticsSummary> getAnalyticsSummary() {
        try {
            long totalCafes = cafeRepository.count();
            long totalOrders = cafeOrderRepository.count();
            long totalBookings = cafeBookingRepository.count();

            double revenue = 0.0;
            List<CafeOrder> allOrders = cafeOrderRepository.findAll();
            if (allOrders != null) {
                for (CafeOrder o : allOrders) {
                    if (o == null || o.getTotalAmount() == null) continue;
                    revenue += o.getTotalAmount();
                }
            }

            AdminAnalyticsSummary s = new AdminAnalyticsSummary();
            s.setTotalCafes(totalCafes);
            s.setTotalOrders(totalOrders);
            s.setTotalBookings(totalBookings);
            s.setTotalOrderRevenue(revenue);
            return ResponseEntity.ok(s);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<AdminAnalyticsDetailsResponse> getAnalyticsDetails() {
        try {
            List<CafeOrder> orders = cafeOrderRepository.findAllWithItems();

            Map<Long, AdminCafeMetricRow> byCafe = new HashMap<>();
            Map<Long, AdminItemMetricRow> byItem = new HashMap<>();
            Map<Integer, AdminHourMetricRow> byHour = new HashMap<>();
            Map<String, AdminCityMetricRow> byCity = new HashMap<>();

            long totalOrders = 0;
            double totalRevenue = 0.0;

            if (orders != null) {
                for (CafeOrder o : orders) {
                    if (o == null) continue;
                    totalOrders++;
                    double ordTotal = o.getTotalAmount() == null ? 0.0 : o.getTotalAmount();
                    totalRevenue += ordTotal;

                    Cafe cafe = o.getCafe();
                    Long cafeId = cafe == null ? null : cafe.getId();
                    if (cafeId != null) {
                        AdminCafeMetricRow cm = byCafe.computeIfAbsent(cafeId, k -> {
                            AdminCafeMetricRow r = new AdminCafeMetricRow();
                            r.setCafeId(k);
                            r.setCafeName(cafe.getCafeName());
                            r.setCity(cafe.getCity());
                            r.setOrderCount(0L);
                            r.setOrderRevenue(0.0);
                            return r;
                        });
                        cm.setOrderCount((cm.getOrderCount() == null ? 0L : cm.getOrderCount()) + 1);
                        cm.setOrderRevenue((cm.getOrderRevenue() == null ? 0.0 : cm.getOrderRevenue()) + ordTotal);

                        String cityKey = cafe.getCity() == null ? "Unknown" : cafe.getCity();
                        AdminCityMetricRow city = byCity.computeIfAbsent(cityKey, k -> {
                            AdminCityMetricRow r = new AdminCityMetricRow();
                            r.setCity(k);
                            r.setOrderCount(0L);
                            r.setOrderRevenue(0.0);
                            return r;
                        });
                        city.setOrderCount((city.getOrderCount() == null ? 0L : city.getOrderCount()) + 1);
                        city.setOrderRevenue((city.getOrderRevenue() == null ? 0.0 : city.getOrderRevenue()) + ordTotal);
                    }

                    long createdAt = o.getCreatedAt() == null ? 0L : o.getCreatedAt();
                    LocalDateTime dt = LocalDateTime.ofInstant(Instant.ofEpochMilli(createdAt), ZoneId.systemDefault());
                    int hour = dt.getHour();
                    AdminHourMetricRow hm = byHour.computeIfAbsent(hour, k -> {
                        AdminHourMetricRow r = new AdminHourMetricRow();
                        r.setHour(k);
                        r.setOrderCount(0L);
                        r.setOrderRevenue(0.0);
                        return r;
                    });
                    hm.setOrderCount((hm.getOrderCount() == null ? 0L : hm.getOrderCount()) + 1);
                    hm.setOrderRevenue((hm.getOrderRevenue() == null ? 0.0 : hm.getOrderRevenue()) + ordTotal);

                    if (o.getItems() != null) {
                        for (CafeOrderItem it : o.getItems()) {
                            if (it == null) continue;
                            Long itemId = it.getMenuItemId();
                            if (itemId == null) continue;
                            long qty = it.getQty() == null ? 0 : it.getQty();
                            double rev = (it.getPrice() == null ? 0.0 : it.getPrice()) * qty;
                            AdminItemMetricRow im = byItem.computeIfAbsent(itemId, k -> {
                                AdminItemMetricRow r = new AdminItemMetricRow();
                                r.setMenuItemId(k);
                                r.setItemName(it.getItemName());
                                r.setTotalQty(0L);
                                r.setTotalRevenue(0.0);
                                return r;
                            });
                            im.setTotalQty((im.getTotalQty() == null ? 0L : im.getTotalQty()) + qty);
                            im.setTotalRevenue((im.getTotalRevenue() == null ? 0.0 : im.getTotalRevenue()) + rev);
                        }
                    }
                }
            }

            long totalCafes = cafeRepository.count();
            long totalBookings = cafeBookingRepository.count();

            AdminAnalyticsSummary summary = new AdminAnalyticsSummary();
            summary.setTotalCafes(totalCafes);
            summary.setTotalOrders(totalOrders);
            summary.setTotalBookings(totalBookings);
            summary.setTotalOrderRevenue(totalRevenue);

            List<AdminCafeMetricRow> topCafes = byCafe.values().stream()
                    .sorted(Comparator.comparing((AdminCafeMetricRow r) -> r.getOrderRevenue() == null ? 0.0 : r.getOrderRevenue()).reversed())
                    .limit(10)
                    .toList();

            List<AdminItemMetricRow> topItems = byItem.values().stream()
                    .sorted(Comparator.comparing((AdminItemMetricRow r) -> r.getTotalQty() == null ? 0L : r.getTotalQty()).reversed())
                    .limit(10)
                    .toList();

            List<AdminHourMetricRow> busyHours = byHour.values().stream()
                    .sorted(Comparator.comparing((AdminHourMetricRow r) -> r.getHour() == null ? 0 : r.getHour()))
                    .toList();

            List<AdminCityMetricRow> citySales = byCity.values().stream()
                    .sorted(Comparator.comparing((AdminCityMetricRow r) -> r.getOrderRevenue() == null ? 0.0 : r.getOrderRevenue()).reversed())
                    .limit(20)
                    .toList();

            AdminAnalyticsDetailsResponse resp = new AdminAnalyticsDetailsResponse();
            resp.setSummary(summary);
            resp.setTopCafes(topCafes);
            resp.setTopItems(topItems);
            resp.setBusyHours(busyHours);
            resp.setCitySales(citySales);
            return ResponseEntity.ok(resp);
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
                cafeRepository.findFirstByOwner_UsernameOrderByIdDesc(u.getUsername()).ifPresent(c -> r.setCafeName(c.getCafeName()));
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
    public ResponseEntity<CafeProfileResponse> updateCafeProfile(Long cafeId, CafeProfileRequest request) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            cafe.setCafeName(request.getCafeName() == null ? null : request.getCafeName().trim());
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
            cafe.setActive(request.getActive());

            cafeRepository.save(cafe);
            return ResponseEntity.ok(toCafeResponse(cafe));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<CafeImageRow>> listCafeImages(Long cafeId) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            List<CafeImage> imgs = cafeImageRepository.findByCafeId(cafeId);
            List<CafeImageRow> rows = (imgs == null ? List.<CafeImageRow>of() : imgs.stream().filter(i -> i != null).map(this::toImageRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeImageRow> uploadCafeImage(Long cafeId, MultipartFile file, Boolean cover) {
        try {
            if (cafeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
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

            boolean makeCover = Boolean.TRUE.equals(cover);
            if (makeCover) {
                try {
                    List<CafeImage> existing = cafeImageRepository.findByCafeId(cafeId);
                    if (existing != null) {
                        for (CafeImage img : existing) {
                            if (img == null) continue;
                            if (Boolean.TRUE.equals(img.getCover())) {
                                img.setCover(false);
                                cafeImageRepository.save(img);
                            }
                        }
                    }
                } catch (RuntimeException ignored) {
                }
            }

            CafeImage img = new CafeImage();
            img.setCafe(cafe);
            img.setFilename(orig);
            img.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
            img.setFilePath(target.toAbsolutePath().toString());
            img.setSize(file.getSize());
            img.setCover(makeCover);
            cafeImageRepository.save(img);

            return ResponseEntity.status(HttpStatus.CREATED).body(toImageRow(img));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> deleteCafeImage(Long cafeId, Long imageId) {
        try {
            if (cafeId == null || imageId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Cafe cafe = cafeRepository.findById(cafeId).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            CafeImage img = cafeImageRepository.findById(imageId).orElse(null);
            if (img == null || img.getCafe() == null || img.getCafe().getId() == null || !img.getCafe().getId().equals(cafeId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
            }

            try {
                if (img.getFilePath() != null && !img.getFilePath().isBlank()) {
                    Files.deleteIfExists(Path.of(img.getFilePath()));
                }
            } catch (Exception ignored) {
            }

            cafeImageRepository.deleteById(imageId);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete");
        }
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
    public ResponseEntity<AdminUserDetail> getUserDetailByUsername(String username) {
        try {
            if (username == null || username.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            User u = userRepository.findByUsername(username).orElse(null);
            if (u == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return getUserDetail(u.getId());
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

            if (user.getRole() == Role.OWNER) {
                List<Cafe> owned = cafeRepository.findByOwner_UsernameOrderByIdDesc(user.getUsername());
                if (owned != null && !owned.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot delete owner with a cafe");
                }
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
