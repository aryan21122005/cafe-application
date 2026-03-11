package com.cafe.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cafe.dto.CafeBookingRow;
import com.cafe.dto.CafeOrderItemRow;
import com.cafe.dto.CafeOrderRow;
import com.cafe.dto.MenuAvailabilityRequest;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.OrderStatusUpdateRequest;
import com.cafe.dto.ServeOrderRequest;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeBooking;
import com.cafe.entity.CafeOrder;
import com.cafe.entity.MenuItem;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.CafeBookingRepository;
import com.cafe.repository.CafeOrderRepository;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.MenuItemRepository;
import com.cafe.repository.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private CafeOrderRepository cafeOrderRepository;

    @Autowired
    private CafeBookingRepository cafeBookingRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemRow>> listMenu(
            @RequestHeader(value = "X-USERNAME", required = false) String staffUsername
    ) {
        try {
            StaffContext ctx = requireStaffContext(staffUsername);
            if (ctx == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<MenuItem> list = menuItemRepository.findByCafeId(ctx.cafe.getId());
            List<MenuItemRow> rows = (list == null ? List.<MenuItemRow>of() : list.stream().map(this::toMenuRow).toList());
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

    private MenuItemRow toMenuRow(MenuItem m) {
        MenuItemRow r = new MenuItemRow();
        r.setId(m.getId());
        r.setName(m.getName());
        r.setDescription(m.getDescription());
        r.setPrice(m.getPrice());
        r.setAvailable(m.getAvailable());
        r.setCategory(m.getCategory());
        if (m.getImageFilePath() != null && !m.getImageFilePath().isBlank()) {
            r.setImageUrl("/api/public/menu-images/" + m.getId());
        }
        return r;
    }

    @PutMapping("/menu/{id}/availability")
    public ResponseEntity<MenuItemRow> updateMenuAvailability(
            @RequestHeader(value = "X-USERNAME", required = false) String staffUsername,
            @PathVariable Long id,
            @Valid @RequestBody MenuAvailabilityRequest request
    ) {
        try {
            StaffContext ctx = requireStaffContext(staffUsername);
            if (ctx == null || ctx.role != Role.CHEF) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getAvailable() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            MenuItem m = menuItemRepository.findById(id).orElse(null);
            if (m == null || m.getCafe() == null || !m.getCafe().getId().equals(ctx.cafe.getId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            m.setAvailable(request.getAvailable());
            menuItemRepository.save(m);
            return ResponseEntity.ok(toMenuRow(m));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<CafeOrderRow>> listOrders(
            @RequestHeader(value = "X-USERNAME", required = false) String staffUsername,
            @RequestParam(value = "status", required = false) String status
    ) {
        try {
            StaffContext ctx = requireStaffContext(staffUsername);
            if (ctx == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Cafe cafe = ctx.cafe;

            List<CafeOrder> list = cafeOrderRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId());
            ensureOrderNumbers(list);

            Set<Long> bookingIds = list.stream()
                    .map(CafeOrder::getBookingId)
                    .filter(id -> id != null)
                    .collect(Collectors.toSet());
            Map<Long, CafeBooking> bookingMap = bookingIds.isEmpty()
                    ? Map.of()
                    : cafeBookingRepository.findAllById(bookingIds).stream()
                    .filter(b -> b != null && b.getId() != null)
                    .collect(Collectors.toMap(CafeBooking::getId, b -> b));

            List<CafeOrderRow> rows = list.stream()
                    .filter(o -> {
                        if (o == null) return false;
                        Long bid = o.getBookingId();
                        if (bid == null) return true;
                        CafeBooking b = bookingMap.get(bid);
                        if (b == null) return false;
                        if (b.getCafe() == null || b.getCafe().getId() == null || !b.getCafe().getId().equals(cafe.getId())) return false;
                        return "APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus()));
                    })
                    .filter(o -> {
                        if (status == null || status.isBlank()) return true;
                        String s1 = String.valueOf(o.getStatus()).trim().toUpperCase();
                        String s2 = status.trim().toUpperCase();
                        return s1.equals(s2);
                    })
                    .map(this::toOrderRow)
                    .toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean isOrderBookingApprovedForCafe(CafeOrder o, Long cafeId) {
        if (o == null) return false;
        Long bid = o.getBookingId();
        if (bid == null) return true;
        CafeBooking b = cafeBookingRepository.findById(bid).orElse(null);
        if (b == null) return false;
        if (b.getCafe() == null || b.getCafe().getId() == null || !b.getCafe().getId().equals(cafeId)) return false;
        return "APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus()));
    }

    @PostMapping("/orders/{id}/status")
    public ResponseEntity<CafeOrderRow> updateOrderStatus(
            @RequestHeader(value = "X-USERNAME", required = false) String staffUsername,
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        try {
            StaffContext ctx = requireStaffContext(staffUsername);
            if (ctx == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            String next = request == null || request.getStatus() == null ? null : request.getStatus().trim().toUpperCase();
            if (next == null || next.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeOrder o = cafeOrderRepository.findByIdAndCafeId(id, ctx.cafe.getId()).orElse(null);
            if (o == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            if (!isOrderBookingApprovedForCafe(o, ctx.cafe.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            String current = String.valueOf(o.getStatus()).trim().toUpperCase();
            boolean chef = ctx.role == Role.CHEF;
            boolean waiter = ctx.role == Role.WAITER;

            if (chef) {
                if (!(next.equals("PREPARING") || next.equals("READY"))) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                if (next.equals("PREPARING") && !(current.equals("PLACED") || current.equals("PREPARING"))) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                if (next.equals("READY") && !(current.equals("PREPARING") || current.equals("READY"))) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
            } else if (waiter) {
                if (!next.equals("SERVED")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                if (!(current.equals("READY") || current.equals("SERVED"))) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            o.setStatus(next);
            cafeOrderRepository.save(o);
            return ResponseEntity.ok(toOrderRow(o));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/orders/{id}/serve")
    public ResponseEntity<CafeOrderRow> serveOrder(
            @RequestHeader(value = "X-USERNAME", required = false) String staffUsername,
            @PathVariable Long id,
            @RequestBody(required = false) ServeOrderRequest request
    ) {
        try {
            StaffContext ctx = requireStaffContext(staffUsername);
            if (ctx == null || ctx.role != Role.WAITER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            CafeOrder o = cafeOrderRepository.findByIdAndCafeId(id, ctx.cafe.getId()).orElse(null);
            if (o == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            String current = String.valueOf(o.getStatus()).trim().toUpperCase();
            if (!(current.equals("READY") || current.equals("SERVED"))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Long bid = o.getBookingId();
            if (bid == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            CafeBooking b = cafeBookingRepository.findById(bid).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (b.getCafe() == null || b.getCafe().getId() == null || !b.getCafe().getId().equals(ctx.cafe.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (!"APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus()))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            String table = b.getAllocatedTable() == null ? null : b.getAllocatedTable().trim();
            if (table == null || table.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            o.setAllocatedTable(table);
            o.setStatus("SERVED");
            cafeOrderRepository.save(o);
            return ResponseEntity.ok(toOrderRow(o));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<CafeBookingRow>> listApprovedBookings(
            @RequestHeader(value = "X-USERNAME", required = false) String staffUsername
    ) {
        try {
            StaffContext ctx = requireStaffContext(staffUsername);
            if (ctx == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<CafeBooking> list = cafeBookingRepository.findByCafeIdOrderByCreatedAtDesc(ctx.cafe.getId());
            List<CafeBookingRow> rows = list.stream()
                    .filter(b -> "APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus())))
                    .map(this::toBookingRow)
                    .toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean isAllocatedTableValidForCafe(Long cafeId, String table) {
        if (cafeId == null) return false;
        if (table == null || table.isBlank()) return false;

        List<CafeBooking> list = cafeBookingRepository.findByCafeIdOrderByCreatedAtDesc(cafeId);
        if (list == null) return false;
        for (CafeBooking b : list) {
            if (b == null) continue;
            if (!"APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus()))) continue;
            if (b.getAllocatedTable() == null) continue;
            if (b.getAllocatedTable().trim().equalsIgnoreCase(table.trim())) return true;
        }
        return false;
    }

    private CafeOrderRow toOrderRow(CafeOrder o) {
        CafeOrderRow r = new CafeOrderRow();
        r.setId(o.getId());
        r.setOrderNumber(o.getOrderNumber());
        r.setCafeId(o.getCafe() == null ? null : o.getCafe().getId());
        r.setCafeName(o.getCafe() == null ? null : o.getCafe().getCafeName());
        r.setCustomerName(o.getCustomerName());
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
            r.setItems(o.getItems().stream().map(it -> {
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
        r.setFunctionType(b.getFunctionType() == null ? null : b.getFunctionType().name());
        r.setAllocatedTable(b.getAllocatedTable());
        r.setCreatedAt(b.getCreatedAt());
        return r;
    }

    private StaffContext requireStaffContext(String username) {
        if (username == null || username.isBlank()) return null;
        User u = userRepository.findByUsername(username.trim()).orElse(null);
        if (u == null) return null;
        if (u.getRole() == null) return null;
        if (!(u.getRole() == Role.CHEF || u.getRole() == Role.WAITER)) return null;

        Optional<Cafe> cafeOpt = cafeRepository.findByStaffUsername(u.getUsername());
        Cafe cafe = cafeOpt.orElse(null);
        if (cafe == null || cafe.getId() == null) return null;

        return new StaffContext(u.getRole(), cafe);
    }

    private static class StaffContext {
        final Role role;
        final Cafe cafe;

        StaffContext(Role role, Cafe cafe) {
            this.role = role;
            this.cafe = cafe;
        }
    }
}
