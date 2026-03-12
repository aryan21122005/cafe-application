package com.cafe.service.impl;

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
import com.cafe.dto.AdminCityMetricRow;
import com.cafe.dto.AdminHourMetricRow;
import com.cafe.dto.AdminItemMetricRow;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.BookingDecisionRequest;
import com.cafe.dto.CafeAmenityRequest;
import com.cafe.dto.CafeAmenityRow;
import com.cafe.dto.CafeBookingRow;
import com.cafe.dto.CafeDocumentRow;
import com.cafe.dto.CafeImageRow;
import com.cafe.dto.CafeOrderItemRow;
import com.cafe.dto.CafeOrderRow;
import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.FunctionCapacityRequest;
import com.cafe.dto.FunctionCapacityRow;
import com.cafe.dto.MenuAvailabilityRequest;
import com.cafe.dto.MenuItemRequest;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.OwnerStaffCreateRequest;
import com.cafe.dto.OwnerCafeRow;
import com.cafe.dto.OwnerStaffRow;
import com.cafe.entity.Address;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeAmenity;
import com.cafe.entity.CafeBooking;
import com.cafe.entity.CafeDocument;
import com.cafe.entity.CafeImage;
import com.cafe.entity.CafeOrder;
import com.cafe.entity.CafeOrderItem;
import com.cafe.entity.Document;
import com.cafe.entity.FunctionCapacity;
import com.cafe.entity.FunctionType;
import com.cafe.entity.MenuItem;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.CafeAmenityRepository;
import com.cafe.repository.CafeBookingRepository;
import com.cafe.repository.CafeDocumentRepository;
import com.cafe.repository.CafeImageRepository;
import com.cafe.repository.CafeOrderRepository;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.FunctionCapacityRepository;
import com.cafe.repository.MenuItemRepository;
import com.cafe.repository.UserRepository;
import com.cafe.service.EmailService;
import com.cafe.service.OwnerService;

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
    private CafeDocumentRepository cafeDocumentRepository;

    @Autowired
    private CafeBookingRepository cafeBookingRepository;

    @Autowired
    private CafeOrderRepository cafeOrderRepository;

    @Autowired
    private CafeAmenityRepository cafeAmenityRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private EmailService emailService;

    @Value("${cafe.images.dir:uploads/cafe-images}")
    private String cafeImagesDir;

    @Value("${cafe.menu.images.dir:uploads/menu-images}")
    private String menuImagesDir;

    private User requireOwner(String ownerUsername) {
        if (ownerUsername == null || ownerUsername.isBlank()) {
            log.warn("requireOwner: ownerUsername is null or blank");
            return null;
        }
        String trimmed = ownerUsername.trim();
        User u = userRepository.findByUsername(trimmed).orElse(null);
        if (u == null) {
            log.warn("requireOwner: User not found for username: {}", trimmed);
            return null;
        }
        if (u.getRole() == null || u.getRole() != Role.OWNER) {
            log.warn("requireOwner: User {} exists but role is {}", trimmed, u.getRole());
            return null;
        }
        return u;
    }

    private Cafe requireCafe(User owner, Long cafeId) {
        if (owner == null) return null;
        if (cafeId != null) {
            return cafeRepository.findByIdAndOwner_Username(cafeId, owner.getUsername()).orElse(null);
        }
        return cafeRepository.findFirstByOwner_UsernameOrderByIdDesc(owner.getUsername()).orElse(null);
    }

    private CafeProfileResponse toCafeProfileResponse(Cafe cafe) {
        if (cafe == null) return null;
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

    private OwnerStaffRow toStaffRow(User u) {
        if (u == null) return null;
        OwnerStaffRow r = new OwnerStaffRow();
        r.setId(u.getId());
        r.setUsername(u.getUsername());
        r.setRole(u.getRole() == null ? null : u.getRole().name());
        r.setApprovalStatus(u.getApprovalStatus() == null ? null : u.getApprovalStatus().name());
        PersonalDetails pd = u.getPersonalDetails();
        if (pd != null) {
            r.setEmail(pd.getEmail());
            r.setPhone(pd.getPhone());
        }
        return r;
    }

    private MenuItemRow toMenuRow(MenuItem m) {
        if (m == null) return null;
        MenuItemRow r = new MenuItemRow();
        r.setId(m.getId());
        r.setName(m.getName());
        r.setDescription(m.getDescription());
        r.setPrice(m.getPrice());
        r.setAvailable(m.getAvailable());
        r.setCategory(m.getCategory());
        r.setImageUrl(m.getId() == null ? null : ("/api/public/menu-images/" + m.getId()));
        return r;
    }

    private FunctionCapacityRow toCapacityRow(FunctionCapacity c) {
        if (c == null) return null;
        FunctionCapacityRow r = new FunctionCapacityRow();
        r.setId(c.getId());
        r.setFunctionType(c.getFunctionType() == null ? null : c.getFunctionType().name());
        r.setTablesAvailable(c.getTablesAvailable());
        r.setTableLabels(c.getTableLabels());
        r.setSeatsPerTable(c.getSeatsPerTable());
        r.setSeatsAvailable(c.getSeatsAvailable());
        r.setPrice(c.getPrice());
        r.setEnabled(c.getEnabled());
        return r;
    }

    private CafeImageRow toImageRow(CafeImage img) {
        if (img == null) return null;
        CafeImageRow r = new CafeImageRow();
        r.setId(img.getId());
        r.setFilename(img.getFilename());
        r.setCover(img.getCover());
        r.setUrl(img.getId() == null ? null : ("/api/public/cafe-images/" + img.getId()));
        return r;
    }

    private CafeAmenityRow toAmenityRow(CafeAmenity a) {
        if (a == null) return null;
        CafeAmenityRow r = new CafeAmenityRow();
        r.setId(a.getId());
        r.setName(a.getName());
        r.setFunctionType(a.getFunctionType() == null ? null : a.getFunctionType().name());
        r.setEnabled(a.getEnabled());
        return r;
    }

    private CafeDocumentRow toCafeDocumentRow(CafeDocument d) {
        if (d == null) return null;
        CafeDocumentRow r = new CafeDocumentRow();
        r.setId(d.getId());
        r.setDocKey(d.getDocKey());
        r.setDocumentName(d.getDocumentName());
        r.setDocumentType(d.getDocumentType());
        r.setSize(d.getSize());
        return r;
    }

    @Override
    public ResponseEntity<AdminAnalyticsSummary> getAnalyticsSummary(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            long totalCafes = 1;

            long totalOrders = 0;
            double revenue = 0.0;
            List<CafeOrder> orders = cafeOrderRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId());
            if (orders != null) {
                for (CafeOrder o : orders) {
                    if (o == null) continue;
                    if (!"PAID".equalsIgnoreCase(String.valueOf(o.getPaymentStatus() == null ? "UNPAID" : o.getPaymentStatus()))) continue;
                    totalOrders++;
                    revenue += (o.getTotalAmount() == null ? 0.0 : o.getTotalAmount());
                }
            }

            long totalBookings = 0;
            List<CafeBooking> bookings = cafeBookingRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId());
            if (bookings != null) {
                for (CafeBooking b : bookings) {
                    if (b == null) continue;
                    if (!"PAID".equalsIgnoreCase(String.valueOf(b.getPaymentStatus() == null ? "UNPAID" : b.getPaymentStatus()))) continue;
                    totalBookings++;
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
    public ResponseEntity<CafeProfileResponse> getCafe(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.ok(toCafeProfileResponse(cafe));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<AdminAnalyticsDetailsResponse> getAnalyticsDetails(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            List<CafeOrder> orders = cafeOrderRepository.findByCafeIdWithItems(cafe.getId());

            Map<Long, AdminCafeMetricRow> byCafe = new HashMap<>();
            Map<Long, AdminItemMetricRow> byItem = new HashMap<>();
            Map<Integer, AdminHourMetricRow> byHour = new HashMap<>();
            Map<String, AdminCityMetricRow> byCity = new HashMap<>();

            long totalOrders = 0;
            double totalRevenue = 0.0;

            if (orders != null) {
                for (CafeOrder o : orders) {
                    if (o == null) continue;
                    if (!"PAID".equalsIgnoreCase(String.valueOf(o.getPaymentStatus() == null ? "UNPAID" : o.getPaymentStatus()))) continue;

                    totalOrders++;
                    double ordTotal = o.getTotalAmount() == null ? 0.0 : o.getTotalAmount();
                    totalRevenue += ordTotal;

                    Long cafeIdKey = cafe.getId();
                    AdminCafeMetricRow cm = byCafe.computeIfAbsent(cafeIdKey, k -> {
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

            long totalCafes = 1;
            long totalBookings = 0;
            List<CafeBooking> bookings = cafeBookingRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId());
            if (bookings != null) {
                for (CafeBooking b : bookings) {
                    if (b == null) continue;
                    if (!"PAID".equalsIgnoreCase(String.valueOf(b.getPaymentStatus() == null ? "UNPAID" : b.getPaymentStatus()))) continue;
                    totalBookings++;
                }
            }

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

    @Override
    public ResponseEntity<List<OwnerCafeRow>> listCafes(String ownerUsername) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<Cafe> cafes = cafeRepository.findByOwner_UsernameOrderByIdDesc(owner.getUsername());
            List<OwnerCafeRow> rows = (cafes == null ? List.<OwnerCafeRow>of() : cafes.stream().filter(c -> c != null).map(c -> {
                OwnerCafeRow r = new OwnerCafeRow();
                r.setId(c.getId());
                r.setCafeName(c.getCafeName());
                r.setCity(c.getCity());
                r.setState(c.getState());
                r.setActive(c.getActive());
                r.setApprovalStatus(c.getApprovalStatus() == null ? null : c.getApprovalStatus().name());
                return r;
            }).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String generateTempPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    @Override
    public ResponseEntity<List<CafeDocumentRow>> listCafeDocuments(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            List<CafeDocument> docs = cafeDocumentRepository.findByCafeId(cafe.getId());
            List<CafeDocumentRow> rows = docs.stream().map(this::toCafeDocumentRow).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<AdminUserDetail> getMe(String ownerUsername) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            AdminUserDetail detail = new AdminUserDetail();
            detail.setId(owner.getId());
            detail.setUsername(owner.getUsername());
            detail.setRole(owner.getRole() == null ? null : owner.getRole().name());
            detail.setApprovalStatus(owner.getApprovalStatus() == null ? null : owner.getApprovalStatus().name());
            detail.setForcePasswordChange(owner.getForcePasswordChange());

            PersonalDetails pd = owner.getPersonalDetails();
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

            Address a = owner.getAddress();
            if (a != null) {
                AdminUserDetail.AddressDto ad = new AdminUserDetail.AddressDto();
                ad.setId(a.getId());
                ad.setStreet(a.getStreet());
                ad.setCity(a.getCity());
                ad.setState(a.getState());
                ad.setPincode(a.getPincode());
                detail.setAddress(ad);
            }

            return ResponseEntity.ok(detail);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private List<String> parseDistinctCsv(String raw) {
        List<String> out = new ArrayList<>();
        if (raw == null || raw.isBlank()) return out;
        for (String part : raw.split(",")) {
            if (part == null) continue;
            String t = part.trim();
            if (t.isBlank()) continue;
            if (!out.contains(t)) out.add(t);
        }
        return out;
    }

    private int computeTablesNeeded(Integer guests, Integer seatsPerTable) {
        int g = (guests == null ? 0 : guests);
        if (g <= 0) return 1;
        int spt = (seatsPerTable == null ? 0 : seatsPerTable);
        if (spt <= 0) return 1;
        return (int) Math.ceil((double) g / (double) spt);
    }

    private String allocateTables(Long cafeId, FunctionType functionType, String bookingDate, String bookingTime, Integer guests, String preferredTablesCsv) {
        if (functionType == null) return null;
        FunctionCapacity cap = functionCapacityRepository.findByCafeIdAndFunctionType(cafeId, functionType).orElse(null);
        if (cap == null) return null;
        if (!Boolean.TRUE.equals(cap.getEnabled())) return null;

        List<String> labels = parseDistinctCsv(cap.getTableLabels());
        if (labels.isEmpty()) return null;

        int tablesNeeded = computeTablesNeeded(guests, cap.getSeatsPerTable());
        if (tablesNeeded <= 0) tablesNeeded = 1;
        if (tablesNeeded > labels.size()) return null;

        String bd = (bookingDate == null ? null : bookingDate.trim());
        String bt = (bookingTime == null ? null : bookingTime.trim());

        List<String> used = cafeBookingRepository.findByCafeIdOrderByCreatedAtDesc(cafeId).stream()
                .filter(b -> b != null
                        && functionType.equals(b.getFunctionType())
                        && "APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus()))
                        && b.getAllocatedTable() != null
                        && !b.getAllocatedTable().isBlank()
                        && (bd == null || bd.isBlank() || (b.getBookingDate() != null && b.getBookingDate().trim().equalsIgnoreCase(bd)))
                        && (bt == null || bt.isBlank() || (b.getBookingTime() != null && b.getBookingTime().trim().equalsIgnoreCase(bt))))
                .flatMap(b -> parseDistinctCsv(b.getAllocatedTable()).stream())
                .toList();

        List<String> pref = parseDistinctCsv(preferredTablesCsv);
        List<String> chosen = new ArrayList<>();

        for (String p : pref) {
            if (chosen.size() >= tablesNeeded) break;
            if (p == null || p.isBlank()) continue;
            if (!labels.contains(p)) continue;
            if (used.contains(p)) continue;
            if (!chosen.contains(p)) chosen.add(p);
        }

        for (String t : labels) {
            if (chosen.size() >= tablesNeeded) break;
            if (used.contains(t)) continue;
            if (!chosen.contains(t)) chosen.add(t);
        }

        if (chosen.size() != tablesNeeded) return null;
        return String.join(", ", chosen);
    }

    @Override
    public ResponseEntity<String> deleteBooking(String ownerUsername, Long cafeId, Long bookingId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (bookingId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeBooking b = cafeBookingRepository.findByIdAndCafeId(bookingId, cafe.getId()).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
            }

            cafeBookingRepository.delete(b);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeBookingRow> approveBooking(String ownerUsername, Long cafeId, Long bookingId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (bookingId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeBooking b = cafeBookingRepository.findByIdAndCafeId(bookingId, cafe.getId()).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            String curr = String.valueOf(b.getStatus() == null ? "PENDING" : b.getStatus()).trim().toUpperCase();
            if (curr.equals("APPROVED")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (curr.equals("DENIED_WITH_REFUND")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            FunctionType ft = b.getFunctionType();
            if (ft == null) {
                ft = FunctionType.DINE_IN;
                b.setFunctionType(ft);
            }

            String allocated = allocateTables(
                    cafe.getId(),
                    ft,
                    b.getBookingDate(),
                    b.getBookingTime(),
                    b.getGuests(),
                    b.getAllocatedTable()
            );
            if (allocated == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            b.setAllocatedTable(allocated);

            b.setStatus("APPROVED");
            b.setDenialReason(null);
            cafeBookingRepository.save(b);

            List<CafeOrder> linked = cafeOrderRepository.findByBookingId(b.getId());
            if (linked != null) {
                for (CafeOrder o : linked) {
                    if (o == null) continue;
                    o.setAllocatedTable(allocated);
                    cafeOrderRepository.save(o);
                }
            }

            return ResponseEntity.ok(toBookingRow(b));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeBookingRow> denyBookingWithRefund(String ownerUsername, Long cafeId, Long bookingId, BookingDecisionRequest request) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (bookingId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getReason() == null || request.getReason().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeBooking b = cafeBookingRepository.findByIdAndCafeId(bookingId, cafe.getId()).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            String curr = String.valueOf(b.getStatus() == null ? "PENDING" : b.getStatus()).trim().toUpperCase();
            if (curr.equals("APPROVED")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (curr.equals("DENIED_WITH_REFUND")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            b.setStatus("DENIED_WITH_REFUND");
            b.setDenialReason(request.getReason().trim());
            cafeBookingRepository.save(b);

            return ResponseEntity.ok(toBookingRow(b));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeBookingRow> denyBooking(String ownerUsername, Long cafeId, Long bookingId, BookingDecisionRequest request) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (bookingId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getReason() == null || request.getReason().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeBooking b = cafeBookingRepository.findByIdAndCafeId(bookingId, cafe.getId()).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            b.setStatus("DENIED");
            b.setDenialReason(request.getReason().trim());
            cafeBookingRepository.save(b);

            return ResponseEntity.ok(toBookingRow(b));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<CafeBookingRow>> listBookings(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            List<CafeBooking> list = cafeBookingRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId());
            List<CafeBookingRow> rows = (list == null
                    ? List.<CafeBookingRow>of()
                    : list.stream().filter(b -> b != null).map(this::toBookingRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<CafeOrderRow>> listOrders(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            List<CafeOrder> list = cafeOrderRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId());
            ensureOrderNumbers(list);
            List<CafeOrderRow> rows = (list == null
                    ? List.<CafeOrderRow>of()
                    : list.stream().filter(o -> o != null).map(this::toOrderRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void ensureOrderNumbers(List<CafeOrder> list) {
        if (list == null || list.isEmpty()) return;
        int max = 0;
        for (CafeOrder o : list) {
            if (o != null && o.getOrderNumber() != null && o.getOrderNumber() > max) max = o.getOrderNumber();
        }
        List<CafeOrder> missing = list.stream()
                .filter(o -> o != null && o.getOrderNumber() == null)
                .sorted(java.util.Comparator.comparingLong(o -> o.getCreatedAt() == null ? 0L : o.getCreatedAt()))
                .toList();
        int next = max + 1;
        for (CafeOrder o : missing) {
            o.setOrderNumber(next++);
            cafeOrderRepository.save(o);
        }
    }

    private CafeOrderRow toOrderRow(CafeOrder o) {
        if (o == null) return null;
        CafeOrderRow r = new CafeOrderRow();
        r.setId(o.getId());
        r.setOrderNumber(o.getOrderNumber());
        r.setCafeId(o.getCafe() == null ? null : o.getCafe().getId());
        r.setCafeName(o.getCafe() == null ? null : o.getCafe().getCafeName());
        r.setOwnerNames(o.getCafe() == null ? null : o.getCafe().getOwnerNames());
        r.setCustomerUsername(o.getCustomerUsername());
        r.setCustomerName(o.getCustomerName());
        try {
            String email = null;
            if (o.getCustomerUsername() != null && !o.getCustomerUsername().isBlank()) {
                User u = userRepository.findByUsername(o.getCustomerUsername()).orElse(null);
                if (u != null && u.getPersonalDetails() != null) {
                    email = u.getPersonalDetails().getEmail();
                }
            }
            r.setCustomerEmail(email);
        } catch (Exception ignored) {
            r.setCustomerEmail(null);
        }
        r.setCustomerPhone(o.getCustomerPhone());
        r.setStatus(o.getStatus());
        r.setTotalAmount(o.getTotalAmount());
        r.setPaymentStatus(o.getPaymentStatus() == null ? "UNPAID" : o.getPaymentStatus());
        r.setRazorpayOrderId(o.getRazorpayOrderId());
        r.setRazorpayPaymentId(o.getRazorpayPaymentId());
        r.setPaidAt(o.getPaidAt());
        r.setAmenityPreference(o.getAmenityPreference());
        r.setAllocatedTable(o.getAllocatedTable());
        r.setCreatedAt(o.getCreatedAt());
        if (o.getItems() != null) {
            r.setItems(o.getItems().stream().filter(it -> it != null).map(it -> {
                CafeOrderItemRow ir = new CafeOrderItemRow();
                ir.setMenuItemId(it.getMenuItemId());
                ir.setItemName(it.getItemName());
                ir.setPrice(it.getPrice());
                ir.setQty(it.getQty());
                return ir;
            }).toList());
        }
        return r;
    }

    private CafeBookingRow toBookingRow(CafeBooking b) {
        if (b == null) return null;
        CafeBookingRow r = new CafeBookingRow();
        r.setId(b.getId());
        r.setCafeId(b.getCafe() == null ? null : b.getCafe().getId());
        r.setCafeName(b.getCafe() == null ? null : b.getCafe().getCafeName());
        r.setCustomerUsername(b.getCustomerUsername());
        r.setCustomerName(b.getCustomerName());
        r.setCustomerPhone(b.getCustomerPhone());
        r.setBookingDate(b.getBookingDate());
        r.setBookingTime(b.getBookingTime());
        r.setGuests(b.getGuests());
        r.setNote(b.getNote());
        r.setStatus(b.getStatus());
        r.setPaymentStatus(b.getPaymentStatus() == null ? "UNPAID" : b.getPaymentStatus());
        r.setRazorpayOrderId(b.getRazorpayOrderId());
        r.setRazorpayPaymentId(b.getRazorpayPaymentId());
        r.setPaidAt(b.getPaidAt());
        r.setDenialReason(b.getDenialReason());
        r.setAmenityPreference(b.getAmenityPreference());
        r.setFunctionType(b.getFunctionType() == null ? null : b.getFunctionType().name());
        r.setAllocatedTable(b.getAllocatedTable());
        r.setCreatedAt(b.getCreatedAt());
        return r;
    }

    @Override
    public ResponseEntity<String> deleteOrder(String ownerUsername, Long cafeId, Long orderId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (orderId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeOrder o = cafeOrderRepository.findByIdAndCafeId(orderId, cafe.getId()).orElse(null);
            if (o == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
            }
            cafeOrderRepository.deleteById(orderId);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeProfileResponse> upsertCafe(String ownerUsername, Long cafeId, CafeProfileRequest request) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                log.error("upsertCafe: Forbidden - owner not found or not an owner: {}", ownerUsername);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (request == null || request.getCafeName() == null || request.getCafeName().isBlank()) {
                log.error("upsertCafe: Bad Request - cafe name is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Cafe cafe = null;
            if (cafeId != null) {
                cafe = cafeRepository.findByIdAndOwner_Username(cafeId, owner.getUsername()).orElse(null);
                if (cafe == null) {
                    log.warn("upsertCafe: Cafe ID {} not found for owner {}", cafeId, owner.getUsername());
                }
            }
            if (cafe == null) {
                cafe = new Cafe();
                cafe.setOwner(owner);
                cafe.setApprovalStatus(ApprovalStatus.PENDING);
                log.info("upsertCafe: Creating new cafe for owner {}", owner.getUsername());
            }

            cafe.setCafeName(request.getCafeName().trim());
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

            cafeRepository.save(cafe);
            log.info("upsertCafe: Successfully saved cafe: {} (ID: {})", cafe.getCafeName(), cafe.getId());
            return ResponseEntity.ok(toCafeProfileResponse(cafe));
        } catch (Exception ex) {
            log.error("upsertCafe: Error saving cafe for owner {}", ownerUsername, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeProfileResponse> upsertCafeWithDocuments(String ownerUsername, Long cafeId, CafeProfileRequest request, List<String> docKeys, List<MultipartFile> documents) {
        return upsertCafe(ownerUsername, cafeId, request);
    }

    @Override
    public ResponseEntity<String> deleteCafe(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            cafeRepository.deleteById(cafe.getId());
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<OwnerStaffRow>> listStaff(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            List<User> staff = cafe.getStaff() == null ? List.of() : cafe.getStaff();
            List<OwnerStaffRow> rows = staff.stream().filter(u -> u != null).map(this::toStaffRow).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<String> createStaff(String ownerUsername, Long cafeId, OwnerStaffCreateRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Not implemented");
    }

    @Override
    public ResponseEntity<String> createStaffWithDocuments(String ownerUsername, Long cafeId, OwnerStaffCreateRequest request, List<MultipartFile> documents) {
        return createStaff(ownerUsername, cafeId, request);
    }

    @Override
    public ResponseEntity<String> deleteStaff(String ownerUsername, Long cafeId, Long id) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Not implemented");
    }

    @Override
    public ResponseEntity<List<MenuItemRow>> listMenu(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            List<MenuItem> items = menuItemRepository.findByCafeId(cafe.getId());
            List<MenuItemRow> rows = (items == null ? List.<MenuItemRow>of() : items.stream().filter(m -> m != null).map(this::toMenuRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<MenuItemRow> createMenuItem(String ownerUsername, Long cafeId, MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<MenuItemRow> updateMenuItem(String ownerUsername, Long cafeId, Long id, MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<MenuItemRow> updateMenuAvailability(String ownerUsername, Long cafeId, Long id, MenuAvailabilityRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<MenuItemRow> uploadMenuItemImage(String ownerUsername, Long cafeId, Long id, MultipartFile file) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<String> deleteMenuItem(String ownerUsername, Long cafeId, Long id) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Not implemented");
    }

    @Override
    public ResponseEntity<List<FunctionCapacityRow>> listCapacities(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            List<FunctionCapacity> caps = functionCapacityRepository.findByCafeId(cafe.getId());
            List<FunctionCapacityRow> rows = (caps == null ? List.<FunctionCapacityRow>of() : caps.stream().filter(c -> c != null).map(this::toCapacityRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<FunctionCapacityRow> upsertCapacity(String ownerUsername, Long cafeId, FunctionCapacityRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<String> deleteCapacity(String ownerUsername, Long cafeId, Long id) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Not implemented");
    }

    @Override
    public ResponseEntity<List<CafeImageRow>> listImages(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            List<CafeImage> imgs = cafeImageRepository.findByCafeId(cafe.getId());
            List<CafeImageRow> rows = (imgs == null ? List.<CafeImageRow>of() : imgs.stream().filter(i -> i != null).map(this::toImageRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeImageRow> uploadImage(String ownerUsername, Long cafeId, MultipartFile file, Boolean cover) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<String> deleteImage(String ownerUsername, Long cafeId, Long id) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Not implemented");
    }

    @Override
    public ResponseEntity<List<CafeAmenityRow>> listAmenities(String ownerUsername, Long cafeId) {
        try {
            User owner = requireOwner(ownerUsername);
            if (owner == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            Cafe cafe = requireCafe(owner, cafeId);
            if (cafe == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            List<CafeAmenity> list = cafeAmenityRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId());
            List<CafeAmenityRow> rows = (list == null ? List.<CafeAmenityRow>of() : list.stream().filter(a -> a != null).map(this::toAmenityRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<CafeDocumentRow> uploadCafeDocument(String ownerUsername, Long cafeId, String docKey, MultipartFile file) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<byte[]> downloadCafeDocument(String ownerUsername, Long cafeId, Long id) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<CafeAmenityRow> createAmenity(String ownerUsername, Long cafeId, CafeAmenityRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<CafeAmenityRow> updateAmenity(String ownerUsername, Long cafeId, Long id, CafeAmenityRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @Override
    public ResponseEntity<String> deleteAmenity(String ownerUsername, Long cafeId, Long id) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Not implemented");
    }
}
