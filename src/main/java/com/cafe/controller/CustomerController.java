package com.cafe.controller;

import com.cafe.dto.CafeBookingRequest;
import com.cafe.dto.CafeBookingRow;
import com.cafe.dto.CafeOrderRequest;
import com.cafe.dto.CafeOrderRow;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeBooking;
import com.cafe.entity.CafeOrder;
import com.cafe.entity.CafeOrderItem;
import com.cafe.entity.FunctionCapacity;
import com.cafe.entity.FunctionType;
import com.cafe.entity.MenuItem;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.CafeBookingRepository;
import com.cafe.repository.CafeOrderRepository;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.FunctionCapacityRepository;
import com.cafe.repository.MenuItemRepository;
import com.cafe.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CafeBookingRepository cafeBookingRepository;

    @Autowired
    private CafeOrderRepository cafeOrderRepository;

    @Autowired
    private FunctionCapacityRepository functionCapacityRepository;

    @GetMapping("/bookings")
    public ResponseEntity<List<CafeBookingRow>> listMyBookings(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<CafeBooking> list = cafeBookingRepository.findByCustomerUsernameOrderByCreatedAtDesc(customer.getUsername());

            if ((list == null || list.isEmpty())
                    && customer.getPersonalDetails() != null
                    && customer.getPersonalDetails().getPhone() != null
                    && !customer.getPersonalDetails().getPhone().isBlank()) {
                String phone = customer.getPersonalDetails().getPhone().trim();
                List<CafeBooking> legacy = cafeBookingRepository.findByCustomerPhoneOrderByCreatedAtDesc(phone);
                if (legacy != null && !legacy.isEmpty()) {
                    for (CafeBooking b : legacy) {
                        if (b != null && (b.getCustomerUsername() == null || b.getCustomerUsername().isBlank())) {
                            b.setCustomerUsername(customer.getUsername());
                            cafeBookingRepository.save(b);
                        }
                    }
                    list = cafeBookingRepository.findByCustomerUsernameOrderByCreatedAtDesc(customer.getUsername());
                }
            }

            List<CafeBookingRow> rows = (list == null ? List.<CafeBookingRow>of() : list.stream().map(this::toBookingRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<String> deleteMyOrder(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @PathVariable Long id
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeOrder o = cafeOrderRepository.findById(id).orElse(null);
            if (o == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
            }

            if (o.getCustomerUsername() != null && !o.getCustomerUsername().isBlank()) {
                if (!o.getCustomerUsername().equals(customer.getUsername())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            } else {
                String phone = null;
                if (customer.getPersonalDetails() != null && customer.getPersonalDetails().getPhone() != null) {
                    phone = customer.getPersonalDetails().getPhone().trim();
                }
                if (phone == null || phone.isBlank()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                if (o.getCustomerPhone() == null || !o.getCustomerPhone().trim().equals(phone)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }

            cafeOrderRepository.delete(o);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String allocateDineInTable(Long cafeId, String preferredTable) {
        FunctionCapacity cap = functionCapacityRepository.findByCafeIdAndFunctionType(cafeId, FunctionType.DINE_IN).orElse(null);
        if (cap == null) return null;
        if (!Boolean.TRUE.equals(cap.getEnabled())) return null;
        Integer available = cap.getTablesAvailable();
        if (available == null || available <= 0) return null;

        cap.setTablesAvailable(available - 1);
        functionCapacityRepository.save(cap);

        String pref = (preferredTable == null ? null : preferredTable.trim());
        if (pref != null && !pref.isBlank()) {
            return pref;
        }
        return "DINE_IN_TABLE_" + System.currentTimeMillis();
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<String> deleteMyBooking(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @PathVariable Long id
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeBooking b = cafeBookingRepository.findById(id).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
            }
            if (b.getCustomerUsername() == null || !b.getCustomerUsername().equals(customer.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            cafeBookingRepository.delete(b);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/cafes/{cafeId}/bookings")
    public ResponseEntity<CafeBookingRow> createBooking(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @PathVariable Long cafeId,
            @Valid @RequestBody CafeBookingRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireApprovedCafe(cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            if (request == null
                    || request.getCustomerName() == null || request.getCustomerName().isBlank()
                    || request.getCustomerPhone() == null || request.getCustomerPhone().isBlank()
                    || request.getBookingDate() == null || request.getBookingDate().isBlank()
                    || request.getBookingTime() == null || request.getBookingTime().isBlank()
                    || request.getGuests() == null || request.getGuests() <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeBooking b = new CafeBooking();
            b.setCafe(cafe);
            b.setCustomerUsername(customer.getUsername());
            b.setCustomerName(request.getCustomerName().trim());
            b.setCustomerPhone(request.getCustomerPhone().trim());
            b.setBookingDate(request.getBookingDate().trim());
            b.setBookingTime(request.getBookingTime().trim());
            b.setGuests(request.getGuests());
            b.setNote(request.getNote());

            cafeBookingRepository.save(b);
            return ResponseEntity.status(HttpStatus.CREATED).body(toBookingRow(b));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/cafes/{cafeId}/orders")
    public ResponseEntity<CafeOrderRow> createOrder(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @PathVariable Long cafeId,
            @Valid @RequestBody CafeOrderRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = requireApprovedCafe(cafeId);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            if (request == null
                    || request.getCustomerName() == null || request.getCustomerName().isBlank()
                    || request.getCustomerPhone() == null || request.getCustomerPhone().isBlank()
                    || request.getItems() == null || request.getItems().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            String allocated = allocateDineInTable(cafe.getId(), request.getAllocatedTable());
            if (allocated == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeOrder o = new CafeOrder();
            o.setCafe(cafe);
            o.setCustomerName(request.getCustomerName().trim());
            o.setCustomerUsername(customer.getUsername());
            o.setCustomerPhone(request.getCustomerPhone().trim());
            o.setAmenityPreference(request.getAmenityPreference());
            o.setStatus("PLACED");
            o.setAllocatedTable(allocated);

            List<CafeOrderItem> items = new ArrayList<>();
            double total = 0.0;

            for (var ir : request.getItems()) {
                if (ir == null || ir.getMenuItemId() == null || ir.getQty() == null || ir.getQty() <= 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                MenuItem mi = menuItemRepository.findById(ir.getMenuItemId()).orElse(null);
                if (mi == null || mi.getCafe() == null || mi.getCafe().getId() == null || !mi.getCafe().getId().equals(cafe.getId())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }

                CafeOrderItem oi = new CafeOrderItem();
                oi.setOrder(o);
                oi.setMenuItemId(mi.getId());
                oi.setItemName(mi.getName());
                oi.setPrice(mi.getPrice());
                oi.setQty(ir.getQty());

                items.add(oi);
                total += (mi.getPrice() == null ? 0.0 : mi.getPrice()) * ir.getQty();
            }

            o.setTotalAmount(total);
            o.getItems().clear();
            o.getItems().addAll(items);

            cafeOrderRepository.save(o);

            CafeBooking b = new CafeBooking();
            b.setCafe(cafe);
            b.setCustomerUsername(customer.getUsername());
            b.setCustomerName(o.getCustomerName());
            b.setCustomerPhone(o.getCustomerPhone());
            b.setBookingDate(LocalDate.now().toString());
            b.setBookingTime(LocalTime.now().withNano(0).toString());
            b.setGuests(1);
            b.setAmenityPreference(request.getAmenityPreference());
            b.setAllocatedTable(allocated);
            b.setStatus("APPROVED");
            b.setDenialReason(null);
            cafeBookingRepository.save(b);

            return ResponseEntity.status(HttpStatus.CREATED).body(toOrderRow(o));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<CafeOrderRow>> listMyOrders(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<CafeOrder> list = cafeOrderRepository.findByCustomerUsernameOrderByCreatedAtDesc(customer.getUsername());

            if ((list == null || list.isEmpty())
                    && customer.getPersonalDetails() != null
                    && customer.getPersonalDetails().getPhone() != null
                    && !customer.getPersonalDetails().getPhone().isBlank()) {
                String phone = customer.getPersonalDetails().getPhone().trim();
                List<CafeOrder> legacy = cafeOrderRepository.findByCustomerPhoneOrderByCreatedAtDesc(phone);
                if (legacy != null && !legacy.isEmpty()) {
                    for (CafeOrder o : legacy) {
                        if (o != null && (o.getCustomerUsername() == null || o.getCustomerUsername().isBlank())) {
                            o.setCustomerUsername(customer.getUsername());
                            cafeOrderRepository.save(o);
                        }
                    }
                    list = cafeOrderRepository.findByCustomerUsernameOrderByCreatedAtDesc(customer.getUsername());
                }
            }

            List<CafeOrderRow> rows = (list == null ? List.<CafeOrderRow>of() : list.stream().map(this::toOrderRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private User requireCustomer(String username) {
        if (username == null || username.isBlank()) return null;
        User u = userRepository.findByUsername(username.trim()).orElse(null);
        if (u == null) return null;
        if (u.getRole() == null || u.getRole() != Role.CUSTOMER) return null;
        return u;
    }

    private Cafe requireApprovedCafe(Long id) {
        if (id == null) return null;
        Cafe cafe = cafeRepository.findById(id).orElse(null);
        if (cafe == null) return null;
        if (!Boolean.TRUE.equals(cafe.getActive())) return null;
        if (cafe.getApprovalStatus() == null || cafe.getApprovalStatus() != ApprovalStatus.APPROVED) return null;
        return cafe;
    }

    private CafeBookingRow toBookingRow(CafeBooking b) {
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
        r.setDenialReason(b.getDenialReason());
        r.setAmenityPreference(b.getAmenityPreference());
        r.setAllocatedTable(b.getAllocatedTable());
        r.setCreatedAt(b.getCreatedAt());
        return r;
    }

    private CafeOrderRow toOrderRow(CafeOrder o) {
        CafeOrderRow r = new CafeOrderRow();
        r.setId(o.getId());
        r.setCafeId(o.getCafe() == null ? null : o.getCafe().getId());
        r.setCafeName(o.getCafe() == null ? null : o.getCafe().getCafeName());
        r.setCustomerUsername(o.getCustomerUsername());
        r.setCustomerName(o.getCustomerName());
        r.setCustomerPhone(o.getCustomerPhone());
        r.setStatus(o.getStatus());
        r.setTotalAmount(o.getTotalAmount());
        r.setAmenityPreference(o.getAmenityPreference());
        r.setAllocatedTable(o.getAllocatedTable());
        r.setCreatedAt(o.getCreatedAt());
        if (o.getItems() != null) {
            r.setItems(o.getItems().stream().map(it -> {
                com.cafe.dto.CafeOrderItemRow ir = new com.cafe.dto.CafeOrderItemRow();
                ir.setMenuItemId(it.getMenuItemId());
                ir.setItemName(it.getItemName());
                ir.setPrice(it.getPrice());
                ir.setQty(it.getQty());
                return ir;
            }).toList());
        }
        return r;
    }
}
