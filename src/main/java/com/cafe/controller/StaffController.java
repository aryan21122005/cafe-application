package com.cafe.controller;

import com.cafe.dto.CafeBookingRow;
import com.cafe.dto.CafeOrderItemRow;
import com.cafe.dto.CafeOrderRow;
import com.cafe.dto.OrderStatusUpdateRequest;
import com.cafe.dto.ServeOrderRequest;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeBooking;
import com.cafe.entity.CafeOrder;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.CafeBookingRepository;
import com.cafe.repository.CafeOrderRepository;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
            List<CafeOrderRow> rows = list.stream()
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
            @Valid @RequestBody ServeOrderRequest request
    ) {
        try {
            StaffContext ctx = requireStaffContext(staffUsername);
            if (ctx == null || ctx.role != Role.WAITER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (request == null || request.getAllocatedTable() == null || request.getAllocatedTable().isBlank()) {
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

            String table = request.getAllocatedTable().trim();
            if (!isAllocatedTableValidForCafe(ctx.cafe.getId(), table)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
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
        r.setCafeId(o.getCafe() == null ? null : o.getCafe().getId());
        r.setCafeName(o.getCafe() == null ? null : o.getCafe().getCafeName());
        r.setCustomerName(o.getCustomerName());
        r.setCustomerPhone(o.getCustomerPhone());
        r.setStatus(o.getStatus());
        r.setTotalAmount(o.getTotalAmount());
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
