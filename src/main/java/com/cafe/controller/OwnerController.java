package com.cafe.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cafe.dto.AdminAnalyticsDetailsResponse;
import com.cafe.dto.AdminAnalyticsSummary;
import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.BookingDecisionRequest;
import com.cafe.dto.CafeAmenityRequest;
import com.cafe.dto.CafeAmenityRow;
import com.cafe.dto.CafeBookingRow;
import com.cafe.dto.CafeDocumentRow;
import com.cafe.dto.CafeImageRow;
import com.cafe.dto.CafeOrderRow;
import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.FunctionCapacityRequest;
import com.cafe.dto.FunctionCapacityRow;
import com.cafe.dto.MenuAvailabilityRequest;
import com.cafe.dto.MenuItemRequest;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.OwnerCafeRow;
import com.cafe.dto.OwnerStaffCreateRequest;
import com.cafe.dto.OwnerStaffRow;
import com.cafe.service.OwnerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    @Autowired
    private OwnerService ownerService;

    @GetMapping("/cafes")
    public ResponseEntity<List<OwnerCafeRow>> listCafes(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.listCafes(ownerUsername);
    }

    @GetMapping("/cafe")
    public ResponseEntity<CafeProfileResponse> getCafe(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.getCafe(ownerUsername, cafeId);
    }

    @GetMapping("/me")
    public ResponseEntity<AdminUserDetail> getMe(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.getMe(ownerUsername);
    }

    @PutMapping(value = "/cafe", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CafeProfileResponse> upsertCafe(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @Valid @RequestBody CafeProfileRequest request
    ) {
        return ownerService.upsertCafe(ownerUsername, cafeId, request);
    }

    @PutMapping(value = "/cafe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CafeProfileResponse> upsertCafeWithDocuments(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @Valid @RequestPart("data") CafeProfileRequest request,
            @RequestPart(value = "docKeys", required = false) List<String> docKeys,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return ownerService.upsertCafeWithDocuments(ownerUsername, cafeId, request, docKeys, documents);
    }

    @DeleteMapping("/cafe")
    public ResponseEntity<String> deleteCafe(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.deleteCafe(ownerUsername, cafeId);
    }

    @GetMapping("/cafe/documents")
    public ResponseEntity<List<CafeDocumentRow>> listCafeDocuments(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.listCafeDocuments(ownerUsername, cafeId);
    }

    @PostMapping(value = "/cafe/documents/{docKey}", consumes = {"multipart/form-data"})
    public ResponseEntity<CafeDocumentRow> uploadCafeDocument(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable String docKey,
            @RequestPart("file") MultipartFile file
    ) {
        return ownerService.uploadCafeDocument(ownerUsername, cafeId, docKey, file);
    }

    @GetMapping("/cafe/documents/{id}")
    public ResponseEntity<byte[]> downloadCafeDocument(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.downloadCafeDocument(ownerUsername, cafeId, id);
    }

    @GetMapping("/staff")
    public ResponseEntity<List<OwnerStaffRow>> listStaff(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.listStaff(ownerUsername, cafeId);
    }

    @PostMapping("/staff")
    public ResponseEntity<String> createStaff(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @Valid @RequestBody OwnerStaffCreateRequest request
    ) {
        return ownerService.createStaff(ownerUsername, cafeId, request);
    }

    @PostMapping(value = "/staff", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> createStaffWithDocuments(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @Valid @RequestPart("data") OwnerStaffCreateRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return ownerService.createStaffWithDocuments(ownerUsername, cafeId, request, documents);
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<String> deleteStaff(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.deleteStaff(ownerUsername, cafeId, id);
    }

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemRow>> listMenu(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.listMenu(ownerUsername, cafeId);
    }

    @GetMapping("/analytics/summary")
    public ResponseEntity<AdminAnalyticsSummary> getAnalyticsSummary(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.getAnalyticsSummary(ownerUsername, cafeId);
    }

    @GetMapping("/analytics/details")
    public ResponseEntity<AdminAnalyticsDetailsResponse> getAnalyticsDetails(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.getAnalyticsDetails(ownerUsername, cafeId);
    }

    @PostMapping("/menu")
    public ResponseEntity<MenuItemRow> createMenuItem(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @Valid @RequestBody MenuItemRequest request
    ) {
        return ownerService.createMenuItem(ownerUsername, cafeId, request);
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuItemRow> updateMenuItem(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id,
            @Valid @RequestBody MenuItemRequest request
    ) {
        return ownerService.updateMenuItem(ownerUsername, cafeId, id, request);
    }

    @PutMapping("/menu/{id}/availability")
    public ResponseEntity<MenuItemRow> updateMenuAvailability(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id,
            @Valid @RequestBody MenuAvailabilityRequest request
    ) {
        return ownerService.updateMenuAvailability(ownerUsername, cafeId, id, request);
    }

    @PostMapping(value = "/menu/{id}/image", consumes = {"multipart/form-data"})
    public ResponseEntity<MenuItemRow> uploadMenuItemImage(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file
    ) {
        return ownerService.uploadMenuItemImage(ownerUsername, cafeId, id, file);
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<String> deleteMenuItem(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.deleteMenuItem(ownerUsername, cafeId, id);
    }

    @GetMapping("/capacities")
    public ResponseEntity<List<FunctionCapacityRow>> listCapacities(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.listCapacities(ownerUsername, cafeId);
    }

    @PostMapping("/capacities")
    public ResponseEntity<FunctionCapacityRow> upsertCapacity(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @Valid @RequestBody FunctionCapacityRequest request
    ) {
        return ownerService.upsertCapacity(ownerUsername, cafeId, request);
    }

    @DeleteMapping("/capacities/{id}")
    public ResponseEntity<String> deleteCapacity(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.deleteCapacity(ownerUsername, cafeId, id);
    }

    @GetMapping("/images")
    public ResponseEntity<List<CafeImageRow>> listImages(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.listImages(ownerUsername, cafeId);
    }

    @PostMapping(value = "/images", consumes = {"multipart/form-data"})
    public ResponseEntity<CafeImageRow> uploadImage(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "cover", required = false) Boolean cover
    ) {
        return ownerService.uploadImage(ownerUsername, cafeId, file, cover);
    }

    @DeleteMapping("/images/{id}")
    public ResponseEntity<String> deleteImage(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.deleteImage(ownerUsername, cafeId, id);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<CafeBookingRow>> listBookings(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.listBookings(ownerUsername, cafeId);
    }

    @PostMapping("/bookings/{id}/approve")
    public ResponseEntity<CafeBookingRow> approveBooking(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.approveBooking(ownerUsername, cafeId, id);
    }

    @PostMapping("/bookings/{id}/deny")
    public ResponseEntity<CafeBookingRow> denyBooking(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id,
            @Valid @RequestBody BookingDecisionRequest request
    ) {
        return ownerService.denyBooking(ownerUsername, cafeId, id, request);
    }

    @PostMapping("/bookings/{id}/deny-refund")
    public ResponseEntity<CafeBookingRow> denyBookingWithRefund(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id,
            @Valid @RequestBody BookingDecisionRequest request
    ) {
        return ownerService.denyBookingWithRefund(ownerUsername, cafeId, id, request);
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<String> deleteBooking(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.deleteBooking(ownerUsername, cafeId, id);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<CafeOrderRow>> listOrders(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.listOrders(ownerUsername, cafeId);
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<String> deleteOrder(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.deleteOrder(ownerUsername, cafeId, id);
    }

    @GetMapping("/amenities")
    public ResponseEntity<List<CafeAmenityRow>> listAmenities(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId
    ) {
        return ownerService.listAmenities(ownerUsername, cafeId);
    }

    @PostMapping("/amenities")
    public ResponseEntity<CafeAmenityRow> createAmenity(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @Valid @RequestBody CafeAmenityRequest request
    ) {
        return ownerService.createAmenity(ownerUsername, cafeId, request);
    }

    @PutMapping("/amenities/{id}")
    public ResponseEntity<CafeAmenityRow> updateAmenity(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id,
            @Valid @RequestBody CafeAmenityRequest request
    ) {
        return ownerService.updateAmenity(ownerUsername, cafeId, id, request);
    }

    @DeleteMapping("/amenities/{id}")
    public ResponseEntity<String> deleteAmenity(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestHeader(value = "X-CAFE-ID", required = false) Long cafeId,
            @PathVariable Long id
    ) {
        return ownerService.deleteAmenity(ownerUsername, cafeId, id);
    }
}
