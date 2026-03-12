package com.cafe.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cafe.dto.CafeBookingRequest;
import com.cafe.dto.CafeBookingRow;
import com.cafe.dto.CafeOrderRequest;
import com.cafe.dto.CafeOrderRow;
import com.cafe.dto.RazorpayConfirmBookingFoodOrderRequest;
import com.cafe.dto.RazorpayConfirmCartOrderRequest;
import com.cafe.dto.RazorpayCreateOrderResponse;
import com.cafe.dto.RazorpayVerifyPaymentRequest;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeBooking;
import com.cafe.entity.CafeOrder;
import com.cafe.entity.CafeOrderItem;
import com.cafe.entity.FunctionCapacity;
import com.cafe.entity.FunctionType;
import com.cafe.entity.MenuItem;
import com.cafe.entity.Payment;
import com.cafe.entity.Role;
import com.cafe.entity.User;
import com.cafe.repository.CafeBookingRepository;
import com.cafe.repository.CafeOrderRepository;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.FunctionCapacityRepository;
import com.cafe.repository.MenuItemRepository;
import com.cafe.repository.PaymentRepository;
import com.cafe.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private static final long BOOKING_FEE_PAISE = 1000L;

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

    @Autowired
    private PaymentRepository paymentRepository;

    @Value("${razorpay.key_id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key_secret:}")
    private String razorpayKeySecret;

    private String hmacSha256Hex(String data, String secret) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secretKey);
            byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to compute signature", ex);
        }
    }

    @PostMapping("/bookings/{id}/payment/razorpay/order")
    public ResponseEntity<?> createRazorpayOrderForBooking(
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
            if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key id not configured. Set environment variable RAZORPAY_KEY_ID (or razorpay.key_id in application.properties).");
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key secret not configured. Set environment variable RAZORPAY_KEY_SECRET (or razorpay.key_secret in application.properties).");
            }

            CafeBooking b = cafeBookingRepository.findById(id).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
            }
            if (b.getCustomerUsername() == null || !b.getCustomerUsername().equals(customer.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if ("PAID".equalsIgnoreCase(String.valueOf(b.getPaymentStatus() == null ? "UNPAID" : b.getPaymentStatus()))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Booking already paid");
            }

            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject req = new JSONObject();
            req.put("amount", BOOKING_FEE_PAISE);
            req.put("currency", "INR");
            req.put("receipt", "booking_" + b.getId());
            req.put("payment_capture", 1);

            Order rpOrder = client.orders.create(req);
            String rpOrderId = rpOrder.get("id");

            b.setRazorpayOrderId(rpOrderId);
            cafeBookingRepository.save(b);

            RazorpayCreateOrderResponse res = new RazorpayCreateOrderResponse();
            res.setCafeOrderId(null);
            res.setOrderNumber(null);
            res.setRazorpayKeyId(razorpayKeyId);
            res.setRazorpayOrderId(rpOrderId);
            res.setAmountPaise(BOOKING_FEE_PAISE);
            res.setCurrency("INR");
            res.setCafeName(b.getCafe() == null ? null : b.getCafe().getCafeName());
            res.setCustomerName(b.getCustomerName());
            res.setCustomerPhone(b.getCustomerPhone());
            return ResponseEntity.ok(res);
        } catch (RazorpayException ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Razorpay error";
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Razorpay: " + msg);
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Failed to create Razorpay order";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(msg);
        }
    }

    @PostMapping("/bookings/{id}/payment/razorpay/verify")
    public ResponseEntity<?> verifyRazorpayPaymentForBooking(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @PathVariable Long id,
            @Valid @RequestBody RazorpayVerifyPaymentRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null || request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key secret not configured. Set environment variable RAZORPAY_KEY_SECRET (or razorpay.key_secret in application.properties).");
            }

            CafeBooking b = cafeBookingRepository.findById(id).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
            }
            if (b.getCustomerUsername() == null || !b.getCustomerUsername().equals(customer.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            String expectedOrderId = b.getRazorpayOrderId();
            if (expectedOrderId == null || expectedOrderId.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No Razorpay order created for this booking");
            }
            if (!expectedOrderId.equals(request.getRazorpayOrderId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Razorpay order id mismatch");
            }

            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String computed = hmacSha256Hex(payload, razorpayKeySecret);
            if (!safeEquals(computed, request.getRazorpaySignature())) {
                b.setPaymentStatus("FAILED");
                cafeBookingRepository.save(b);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payment signature");
            }

            b.setPaymentStatus("PAID");
            b.setRazorpayPaymentId(request.getRazorpayPaymentId());
            b.setPaidAt(System.currentTimeMillis());
            cafeBookingRepository.save(b);

            return ResponseEntity.ok(toBookingRow(b));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to verify payment");
        }
    }

    private boolean safeEquals(String a, String b) {
        if (a == null || b == null) return false;
        if (a.length() != b.length()) return false;
        int r = 0;
        for (int i = 0; i < a.length(); i++) {
            r |= a.charAt(i) ^ b.charAt(i);
        }
        return r == 0;
    }

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

    @PostMapping("/orders/{id}/payment/razorpay/order")
    public ResponseEntity<?> createRazorpayOrder(
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
            if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key id not configured. Set environment variable RAZORPAY_KEY_ID (or razorpay.key_id in application.properties).");
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key secret not configured. Set environment variable RAZORPAY_KEY_SECRET (or razorpay.key_secret in application.properties).");
            }

            CafeOrder o = cafeOrderRepository.findById(id).orElse(null);
            if (o == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
            }
            if (o.getCustomerUsername() == null || !o.getCustomerUsername().equals(customer.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if ("PAID".equalsIgnoreCase(String.valueOf(o.getPaymentStatus() == null ? "UNPAID" : o.getPaymentStatus()))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order already paid");
            }

            long amountPaise = Math.max(0L, Math.round((o.getTotalAmount() == null ? 0.0 : o.getTotalAmount()) * 100.0));
            if (amountPaise <= 0L) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order total amount must be greater than 0");
            }

            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject req = new JSONObject();
            req.put("amount", amountPaise);
            req.put("currency", "INR");
            req.put("receipt", "cafe_order_" + o.getId());
            req.put("payment_capture", 1);

            Order rpOrder = client.orders.create(req);
            String rpOrderId = rpOrder.get("id");

            o.setRazorpayOrderId(rpOrderId);
            cafeOrderRepository.save(o);

            Payment p = new Payment();
            p.setOrder(o);
            p.setProvider("RAZORPAY");
            p.setCurrency("INR");
            p.setAmountPaise(amountPaise);
            p.setRazorpayOrderId(rpOrderId);
            p.setStatus("CREATED");
            paymentRepository.save(p);

            RazorpayCreateOrderResponse res = new RazorpayCreateOrderResponse();
            res.setCafeOrderId(o.getId());
            res.setOrderNumber(o.getOrderNumber());
            res.setRazorpayKeyId(razorpayKeyId);
            res.setRazorpayOrderId(rpOrderId);
            res.setAmountPaise(amountPaise);
            res.setCurrency("INR");
            res.setCafeName(o.getCafe() == null ? null : o.getCafe().getCafeName());
            res.setCustomerName(o.getCustomerName());
            res.setCustomerPhone(o.getCustomerPhone());
            return ResponseEntity.ok(res);
        } catch (RazorpayException ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Razorpay error";
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Razorpay: " + msg);
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Failed to create Razorpay order";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(msg);
        }
    }

    @PostMapping("/orders/{id}/payment/razorpay/verify")
    public ResponseEntity<?> verifyRazorpayPayment(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @PathVariable Long id,
            @Valid @RequestBody RazorpayVerifyPaymentRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null || request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Razorpay key secret not configured");
            }

            CafeOrder o = cafeOrderRepository.findById(id).orElse(null);
            if (o == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
            }
            if (o.getCustomerUsername() == null || !o.getCustomerUsername().equals(customer.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            String expectedOrderId = o.getRazorpayOrderId();
            if (expectedOrderId == null || expectedOrderId.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No Razorpay order created for this order");
            }
            if (!expectedOrderId.equals(request.getRazorpayOrderId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Razorpay order id mismatch");
            }

            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String computed = hmacSha256Hex(payload, razorpayKeySecret);
            if (!safeEquals(computed, request.getRazorpaySignature())) {
                Payment p = new Payment();
                p.setOrder(o);
                p.setProvider("RAZORPAY");
                p.setCurrency("INR");
                p.setAmountPaise(Math.max(0L, Math.round((o.getTotalAmount() == null ? 0.0 : o.getTotalAmount()) * 100.0)));
                p.setRazorpayOrderId(request.getRazorpayOrderId());
                p.setRazorpayPaymentId(request.getRazorpayPaymentId());
                p.setRazorpaySignature(request.getRazorpaySignature());
                p.setStatus("FAILED");
                paymentRepository.save(p);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payment signature");
            }

            o.setPaymentStatus("PAID");
            o.setRazorpayPaymentId(request.getRazorpayPaymentId());
            o.setPaidAt(System.currentTimeMillis());
            cafeOrderRepository.save(o);

            Payment p = new Payment();
            p.setOrder(o);
            p.setProvider("RAZORPAY");
            p.setCurrency("INR");
            p.setAmountPaise(Math.max(0L, Math.round((o.getTotalAmount() == null ? 0.0 : o.getTotalAmount()) * 100.0)));
            p.setRazorpayOrderId(request.getRazorpayOrderId());
            p.setRazorpayPaymentId(request.getRazorpayPaymentId());
            p.setRazorpaySignature(request.getRazorpaySignature());
            p.setStatus("PAID");
            paymentRepository.save(p);

            return ResponseEntity.ok(toOrderRow(o));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to verify payment");
        }
    }

    @PostMapping("/payment/razorpay/order")
    public ResponseEntity<?> createRazorpayOrderForCart(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @Valid @RequestBody CafeOrderRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key id not configured. Set environment variable RAZORPAY_KEY_ID (or razorpay.key_id in application.properties).");
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key secret not configured. Set environment variable RAZORPAY_KEY_SECRET (or razorpay.key_secret in application.properties).");
            }

            Cafe cafe = requireApprovedCafe(request.getCafeId());
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cafe not found or not approved");
            }

            double total = 0.0;
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                for (var it : request.getItems()) {
                    MenuItem mi = menuItemRepository.findById(it.getMenuItemId()).orElse(null);
                    if (mi == null || !Boolean.TRUE.equals(mi.getAvailable())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or unavailable menu item");
                    }
                    Integer qty = it.getQty();
                    if (qty == null || qty <= 0) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid quantity");
                    }
                    total += mi.getPrice() * qty;
                }
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cart is empty");
            }

            long amountPaise = Math.max(0L, Math.round(total * 100.0));
            if (amountPaise <= 0L) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order total amount must be greater than 0");
            }

            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject req = new JSONObject();
            req.put("amount", amountPaise);
            req.put("currency", "INR");
            req.put("receipt", "cart_" + System.currentTimeMillis());
            req.put("payment_capture", 1);

            Order rpOrder = client.orders.create(req);
            String rpOrderId = rpOrder.get("id");

            RazorpayCreateOrderResponse res = new RazorpayCreateOrderResponse();
            res.setCafeOrderId(null);
            res.setOrderNumber(null);
            res.setRazorpayKeyId(razorpayKeyId);
            res.setRazorpayOrderId(rpOrderId);
            res.setAmountPaise(amountPaise);
            res.setCurrency("INR");
            res.setCafeName(cafe.getCafeName());
            res.setCustomerName(customer.getPersonalDetails() == null ? null : (customer.getPersonalDetails().getFirstName() + " " + customer.getPersonalDetails().getLastName()).trim());
            res.setCustomerPhone(customer.getPersonalDetails() == null ? null : customer.getPersonalDetails().getPhone());
            return ResponseEntity.ok(res);
        } catch (RazorpayException ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Razorpay error";
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Razorpay: " + msg);
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Failed to create Razorpay order";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(msg);
        }
    }

    @PostMapping("/bookings/{id}/food/payment/razorpay/order")
    public ResponseEntity<?> createRazorpayOrderForBookingFood(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @PathVariable Long id,
            @Valid @RequestBody CafeOrderRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null || request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key id not configured. Set environment variable RAZORPAY_KEY_ID (or razorpay.key_id in application.properties).");
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key secret not configured. Set environment variable RAZORPAY_KEY_SECRET (or razorpay.key_secret in application.properties).");
            }

            CafeBooking b = cafeBookingRepository.findById(id).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
            }
            if (b.getCustomerUsername() == null || !b.getCustomerUsername().equals(customer.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (!"PAID".equalsIgnoreCase(String.valueOf(b.getPaymentStatus() == null ? "UNPAID" : b.getPaymentStatus()))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Booking is not paid");
            }
            if (!"APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus() == null ? "PENDING" : b.getStatus()))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Booking must be approved before adding food");
            }

            List<CafeOrder> existing = cafeOrderRepository.findByBookingId(b.getId());
            if (existing != null) {
                for (CafeOrder eo : existing) {
                    if (eo == null) continue;
                    if ("PAID".equalsIgnoreCase(String.valueOf(eo.getPaymentStatus() == null ? "UNPAID" : eo.getPaymentStatus()))) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Food already ordered for this booking");
                    }
                }
            }

            Cafe cafe = b.getCafe();
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cafe not found");
            }
            if (request.getCafeId() == null || !request.getCafeId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cafe mismatch");
            }

            double total = 0.0;
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                for (var it : request.getItems()) {
                    MenuItem mi = menuItemRepository.findById(it.getMenuItemId()).orElse(null);
                    if (mi == null || !Boolean.TRUE.equals(mi.getAvailable())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or unavailable menu item");
                    }
                    Integer qty = it.getQty();
                    if (qty == null || qty <= 0) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid quantity");
                    }
                    total += mi.getPrice() * qty;
                }
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cart is empty");
            }

            long amountPaise = Math.max(0L, Math.round(total * 100.0));
            if (amountPaise <= 0L) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order total amount must be greater than 0");
            }

            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject req = new JSONObject();
            req.put("amount", amountPaise);
            req.put("currency", "INR");
            req.put("receipt", "booking_food_" + b.getId() + "_" + System.currentTimeMillis());
            req.put("payment_capture", 1);

            Order rpOrder = client.orders.create(req);
            String rpOrderId = rpOrder.get("id");

            RazorpayCreateOrderResponse res = new RazorpayCreateOrderResponse();
            res.setCafeOrderId(null);
            res.setOrderNumber(null);
            res.setRazorpayKeyId(razorpayKeyId);
            res.setRazorpayOrderId(rpOrderId);
            res.setAmountPaise(amountPaise);
            res.setCurrency("INR");
            res.setCafeName(cafe.getCafeName());
            res.setCustomerName(b.getCustomerName());
            res.setCustomerPhone(b.getCustomerPhone());
            return ResponseEntity.ok(res);
        } catch (RazorpayException ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Razorpay error";
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Razorpay: " + msg);
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Failed to create Razorpay order";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(msg);
        }
    }

    @PostMapping("/bookings/{id}/food/payment/razorpay/confirm")
    public ResponseEntity<?> confirmBookingFoodOrderAfterPayment(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @PathVariable Long id,
            @Valid @RequestBody RazorpayConfirmBookingFoodOrderRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (id == null || request == null || request.getOrder() == null || request.getPayment() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key secret not configured. Set environment variable RAZORPAY_KEY_SECRET (or razorpay.key_secret in application.properties).");
            }

            CafeBooking b = cafeBookingRepository.findById(id).orElse(null);
            if (b == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
            }
            if (b.getCustomerUsername() == null || !b.getCustomerUsername().equals(customer.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (!"PAID".equalsIgnoreCase(String.valueOf(b.getPaymentStatus() == null ? "UNPAID" : b.getPaymentStatus()))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Booking is not paid");
            }
            if (!"APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus() == null ? "PENDING" : b.getStatus()))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Booking must be approved before adding food");
            }

            List<CafeOrder> existing = cafeOrderRepository.findByBookingId(b.getId());
            if (existing != null) {
                for (CafeOrder eo : existing) {
                    if (eo == null) continue;
                    if ("PAID".equalsIgnoreCase(String.valueOf(eo.getPaymentStatus() == null ? "UNPAID" : eo.getPaymentStatus()))) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Food already ordered for this booking");
                    }
                }
            }

            CafeOrderRequest or = request.getOrder();
            RazorpayVerifyPaymentRequest pay = request.getPayment();

            Cafe cafe = b.getCafe();
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cafe not found");
            }
            if (or.getCafeId() == null || !or.getCafeId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cafe mismatch");
            }

            if (or.getItems() == null || or.getItems().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cart is empty");
            }

            String payload = pay.getRazorpayOrderId() + "|" + pay.getRazorpayPaymentId();
            String computed = hmacSha256Hex(payload, razorpayKeySecret);
            if (!safeEquals(computed, pay.getRazorpaySignature())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payment signature");
            }

            double total = 0.0;
            List<CafeOrderItem> items = new ArrayList<>();
            for (var it : or.getItems()) {
                if (it == null || it.getMenuItemId() == null || it.getQty() == null || it.getQty() <= 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                MenuItem mi = menuItemRepository.findById(it.getMenuItemId()).orElse(null);
                if (mi == null || !Boolean.TRUE.equals(mi.getAvailable())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or unavailable menu item");
                }
                CafeOrderItem oi = new CafeOrderItem();
                oi.setMenuItemId(mi.getId());
                oi.setItemName(mi.getName());
                oi.setPrice(mi.getPrice());
                oi.setQty(it.getQty());
                items.add(oi);
                total += (mi.getPrice() * it.getQty());
            }
            long amountPaise = Math.max(0L, Math.round(total * 100.0));
            if (amountPaise <= 0L) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order total amount must be greater than 0");
            }

            if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key id not configured. Set environment variable RAZORPAY_KEY_ID (or razorpay.key_id in application.properties).");
            }
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            Order rpOrder = client.orders.fetch(pay.getRazorpayOrderId());
            Object rpAmountObj = rpOrder.get("amount");
            long rpAmount = Long.parseLong(String.valueOf(rpAmountObj));
            String rpStatus = rpOrder.get("status");
            if (rpAmount != amountPaise) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment amount mismatch");
            }
            if (rpStatus != null && !String.valueOf(rpStatus).isBlank()) {
                String s = String.valueOf(rpStatus).trim().toLowerCase();
                if ("failed".equals(s)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment not completed");
                }
            }

            String allocated = (b.getAllocatedTable() == null ? null : b.getAllocatedTable().trim());

            CafeOrder o = new CafeOrder();
            o.setCafe(cafe);
            o.setCustomerName(or.getCustomerName().trim());
            o.setCustomerUsername(customer.getUsername());
            o.setCustomerPhone(or.getCustomerPhone().trim());
            o.setAmenityPreference(b.getAmenityPreference());
            o.setAllocatedTable(allocated);
            o.setStatus("PLACED");
            o.setTotalAmount(total);
            o.setPaymentStatus("PAID");
            o.setRazorpayOrderId(pay.getRazorpayOrderId());
            o.setRazorpayPaymentId(pay.getRazorpayPaymentId());
            o.setPaidAt(System.currentTimeMillis());
            o.setBookingId(b.getId());

            Integer maxNo = cafeOrderRepository.findMaxOrderNumberByCafeId(cafe.getId());
            o.setOrderNumber((maxNo == null ? 0 : maxNo) + 1);

            for (CafeOrderItem oi : items) {
                oi.setOrder(o);
            }
            o.setItems(items);

            cafeOrderRepository.save(o);

            Payment p = new Payment();
            p.setOrder(o);
            p.setProvider("RAZORPAY");
            p.setCurrency("INR");
            p.setAmountPaise(amountPaise);
            p.setRazorpayOrderId(pay.getRazorpayOrderId());
            p.setRazorpayPaymentId(pay.getRazorpayPaymentId());
            p.setRazorpaySignature(pay.getRazorpaySignature());
            p.setStatus("PAID");
            paymentRepository.save(p);

            return ResponseEntity.status(HttpStatus.CREATED).body(toOrderRow(o));
        } catch (RazorpayException ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Razorpay error";
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Razorpay: " + msg);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to confirm order");
        }
    }

    @PostMapping("/payment/razorpay/confirm-cart-order")
    public ResponseEntity<?> confirmCartOrderAfterPayment(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @Valid @RequestBody RazorpayConfirmCartOrderRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (request == null || request.getOrder() == null || request.getPayment() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key secret not configured. Set environment variable RAZORPAY_KEY_SECRET (or razorpay.key_secret in application.properties).");
            }

            CafeOrderRequest or = request.getOrder();
            RazorpayVerifyPaymentRequest pay = request.getPayment();
            if (or == null || pay == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Cafe cafe = requireApprovedCafe(or.getCafeId());
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cafe not found or not approved");
            }

            if (or.getBookingDate() == null || or.getBookingDate().isBlank()
                    || or.getBookingTime() == null || or.getBookingTime().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Booking date and time are required");
            }

            if (or.getItems() == null || or.getItems().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cart is empty");
            }

            if (or.getGuests() != null && or.getGuests() <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Guests must be greater than 0");
            }

            // Verify Razorpay signature
            String payload = pay.getRazorpayOrderId() + "|" + pay.getRazorpayPaymentId();
            String computed = hmacSha256Hex(payload, razorpayKeySecret);
            if (!safeEquals(computed, pay.getRazorpaySignature())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payment signature");
            }

            // Compute amount from items
            double total = 0.0;
            List<CafeOrderItem> items = new ArrayList<>();
            for (var it : or.getItems()) {
                if (it == null || it.getMenuItemId() == null || it.getQty() == null || it.getQty() <= 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
                MenuItem mi = menuItemRepository.findById(it.getMenuItemId()).orElse(null);
                if (mi == null || !Boolean.TRUE.equals(mi.getAvailable())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or unavailable menu item");
                }
                CafeOrderItem oi = new CafeOrderItem();
                oi.setMenuItemId(mi.getId());
                oi.setItemName(mi.getName());
                oi.setPrice(mi.getPrice());
                oi.setQty(it.getQty());
                items.add(oi);
                total += (mi.getPrice() * it.getQty());
            }
            long amountPaise = Math.max(0L, Math.round(total * 100.0));
            if (amountPaise <= 0L) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order total amount must be greater than 0");
            }

            // Validate Razorpay order amount and status via fetch
            if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key id not configured. Set environment variable RAZORPAY_KEY_ID (or razorpay.key_id in application.properties).");
            }
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            Order rpOrder = client.orders.fetch(pay.getRazorpayOrderId());
            Object rpAmountObj = rpOrder.get("amount");
            long rpAmount = Long.parseLong(String.valueOf(rpAmountObj));
            String rpStatus = rpOrder.get("status");
            if (rpAmount != amountPaise) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment amount mismatch");
            }
            if (rpStatus != null && !String.valueOf(rpStatus).isBlank()) {
                String s = String.valueOf(rpStatus).trim().toLowerCase();
                if ("failed".equals(s)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment not completed");
                }
            }

            // Create PAID order
            String allocated = (or.getAllocatedTable() == null ? null : or.getAllocatedTable().trim());
            if (allocated == null || allocated.isBlank()) {
                allocated = "DINE_IN_TABLE_" + System.currentTimeMillis();
            }

            CafeOrder o = new CafeOrder();
            o.setCafe(cafe);
            o.setCustomerName(or.getCustomerName().trim());
            o.setCustomerUsername(customer.getUsername());
            o.setCustomerPhone(or.getCustomerPhone().trim());
            o.setAmenityPreference(or.getAmenityPreference());
            o.setAllocatedTable(allocated);
            o.setStatus("PLACED");
            o.setTotalAmount(total);
            o.setPaymentStatus("PAID");
            o.setRazorpayOrderId(pay.getRazorpayOrderId());
            o.setRazorpayPaymentId(pay.getRazorpayPaymentId());
            o.setPaidAt(System.currentTimeMillis());

            CafeBooking b = new CafeBooking();
            b.setCafe(cafe);
            b.setCustomerUsername(customer.getUsername());
            b.setCustomerName(o.getCustomerName());
            b.setCustomerPhone(o.getCustomerPhone());
            b.setBookingDate(or.getBookingDate().trim());
            b.setBookingTime(or.getBookingTime().trim());
            b.setGuests(or.getGuests() == null ? 1 : or.getGuests());
            b.setAmenityPreference(or.getAmenityPreference());
            FunctionType ft;
            try {
                ft = FunctionType.valueOf(String.valueOf(or.getFunctionType() == null ? "DINE_IN" : or.getFunctionType()).trim());
            } catch (Exception ex) {
                ft = FunctionType.DINE_IN;
            }
            b.setFunctionType(ft);
            b.setAllocatedTable(allocated);
            b.setStatus("PENDING");
            b.setDenialReason(null);
            b.setPaymentStatus("PAID");
            b.setRazorpayOrderId(pay.getRazorpayOrderId());
            b.setRazorpayPaymentId(pay.getRazorpayPaymentId());
            b.setPaidAt(o.getPaidAt());
            cafeBookingRepository.save(b);

            o.setBookingId(b.getId());

            Integer maxNo = cafeOrderRepository.findMaxOrderNumberByCafeId(cafe.getId());
            o.setOrderNumber((maxNo == null ? 0 : maxNo) + 1);

            for (CafeOrderItem oi : items) {
                oi.setOrder(o);
            }
            o.setItems(items);

            cafeOrderRepository.save(o);

            Payment p = new Payment();
            p.setOrder(o);
            p.setProvider("RAZORPAY");
            p.setCurrency("INR");
            p.setAmountPaise(amountPaise);
            p.setRazorpayOrderId(pay.getRazorpayOrderId());
            p.setRazorpayPaymentId(pay.getRazorpayPaymentId());
            p.setRazorpaySignature(pay.getRazorpaySignature());
            p.setStatus("PAID");
            paymentRepository.save(p);

            return ResponseEntity.status(HttpStatus.CREATED).body(toOrderRow(o));
        } catch (RazorpayException ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) msg = "Razorpay error";
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Razorpay: " + msg);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to confirm order");
        }
    }

    @PostMapping("/payment/razorpay/confirm-order")
    public ResponseEntity<?> confirmOrderAfterPayment(
            @RequestHeader(value = "X-USERNAME", required = false) String customerUsername,
            @Valid @RequestBody RazorpayVerifyPaymentRequest request
    ) {
        try {
            User customer = requireCustomer(customerUsername);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Razorpay key secret not configured. Set environment variable RAZORPAY_KEY_SECRET (or razorpay.key_secret in application.properties).");
            }

            // Verify Razorpay signature
            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String computed = hmacSha256Hex(payload, razorpayKeySecret);
            if (!safeEquals(computed, request.getRazorpaySignature())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payment signature");
            }

            // TODO: In a real flow, we would need to retrieve the cart/order details from session or a temporary table.
            // For now, we will not create an order here; this endpoint is just to verify the payment.
            // The actual order creation will be done by the client after payment verification.
            // Alternatively, we can store the payment details in a temporary record and later associate with the order.
            // For simplicity, we return success and let the frontend proceed to create the order.

            return ResponseEntity.ok("Payment verified. You can now create the order.");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to verify payment");
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

            FunctionType ft;
            try {
                ft = FunctionType.valueOf(String.valueOf(request.getFunctionType()).trim());
            } catch (Exception ex) {
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
            b.setAmenityPreference(request.getAmenityPreference());
            b.setFunctionType(ft);
            b.setAllocatedTable(request.getAllocatedTable());
            b.setPaymentStatus("UNPAID");
            b.setRazorpayOrderId(null);
            b.setRazorpayPaymentId(null);

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

            String allocated = (request.getAllocatedTable() == null ? null : request.getAllocatedTable().trim());
            if (allocated == null || allocated.isBlank()) {
                allocated = "DINE_IN_TABLE_" + System.currentTimeMillis();
            }

            CafeOrder o = new CafeOrder();
            o.setCafe(cafe);
            o.setCustomerName(request.getCustomerName().trim());
            o.setCustomerUsername(customer.getUsername());
            o.setCustomerPhone(request.getCustomerPhone().trim());
            o.setAmenityPreference(request.getAmenityPreference());
            o.setStatus("PLACED");
            o.setAllocatedTable(allocated);

            Integer maxNo = cafeOrderRepository.findMaxOrderNumberByCafeId(cafe.getId());
            o.setOrderNumber((maxNo == null ? 0 : maxNo) + 1);

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
            b.setStatus("PENDING");
            b.setDenialReason(null);
            cafeBookingRepository.save(b);

            o.setBookingId(b.getId());
            o.setPaymentStatus("UNPAID");
            cafeOrderRepository.save(o);

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

            ensureOrderNumbers(list);
            List<CafeOrderRow> rows = (list == null ? List.<CafeOrderRow>of() : list.stream().map(this::toOrderRow).toList());
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void ensureOrderNumbers(List<CafeOrder> list) {
        if (list == null || list.isEmpty()) return;
        var byCafe = list.stream()
                .filter(o -> o != null && o.getCafe() != null && o.getCafe().getId() != null)
                .collect(java.util.stream.Collectors.groupingBy(o -> o.getCafe().getId()));
        for (var e : byCafe.entrySet()) {
            int max = 0;
            for (CafeOrder o : e.getValue()) {
                if (o != null && o.getOrderNumber() != null && o.getOrderNumber() > max) max = o.getOrderNumber();
            }
            List<CafeOrder> missing = e.getValue().stream()
                    .filter(o -> o != null && o.getOrderNumber() == null)
                    .sorted(java.util.Comparator.comparingLong(o -> o.getCreatedAt() == null ? 0L : o.getCreatedAt()))
                    .toList();
            int next = max + 1;
            for (CafeOrder o : missing) {
                o.setOrderNumber(next++);
                cafeOrderRepository.save(o);
            }
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

    private CafeOrderRow toOrderRow(CafeOrder o) {
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
}
