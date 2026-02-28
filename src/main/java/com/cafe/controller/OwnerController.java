package com.cafe.controller;

import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.CafeImageRow;
import com.cafe.dto.FunctionCapacityRequest;
import com.cafe.dto.FunctionCapacityRow;
import com.cafe.dto.MenuItemRequest;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.OwnerStaffCreateRequest;
import com.cafe.dto.OwnerStaffRow;
import com.cafe.dto.CafeDocumentRow;
import com.cafe.dto.CafeBookingRow;
import com.cafe.dto.CafeOrderRow;
import com.cafe.service.OwnerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    @Autowired
    private OwnerService ownerService;

    @GetMapping("/cafe")
    public ResponseEntity<CafeProfileResponse> getCafe(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.getCafe(ownerUsername);
    }

    @PutMapping(value = "/cafe", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CafeProfileResponse> upsertCafe(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestBody CafeProfileRequest request
    ) {
        return ownerService.upsertCafe(ownerUsername, request);
    }

    @PutMapping(value = "/cafe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CafeProfileResponse> upsertCafeWithDocuments(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestPart("data") CafeProfileRequest request,
            @RequestPart(value = "docKeys", required = false) List<String> docKeys,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return ownerService.upsertCafeWithDocuments(ownerUsername, request, docKeys, documents);
    }

    @DeleteMapping("/cafe")
    public ResponseEntity<String> deleteCafe(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.deleteCafe(ownerUsername);
    }

    @GetMapping("/cafe/documents")
    public ResponseEntity<List<CafeDocumentRow>> listCafeDocuments(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.listCafeDocuments(ownerUsername);
    }

    @PostMapping(value = "/cafe/documents/{docKey}", consumes = {"multipart/form-data"})
    public ResponseEntity<CafeDocumentRow> uploadCafeDocument(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @PathVariable String docKey,
            @RequestPart("file") MultipartFile file
    ) {
        return ownerService.uploadCafeDocument(ownerUsername, docKey, file);
    }

    @GetMapping("/cafe/documents/{id}")
    public ResponseEntity<byte[]> downloadCafeDocument(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @PathVariable Long id
    ) {
        return ownerService.downloadCafeDocument(ownerUsername, id);
    }

    @GetMapping("/staff")
    public ResponseEntity<List<OwnerStaffRow>> listStaff(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.listStaff(ownerUsername);
    }

    @PostMapping("/staff")
    public ResponseEntity<String> createStaff(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestBody OwnerStaffCreateRequest request
    ) {
        return ownerService.createStaff(ownerUsername, request);
    }

    @PostMapping(value = "/staff", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> createStaffWithDocuments(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestPart("data") OwnerStaffCreateRequest request,
            @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        return ownerService.createStaffWithDocuments(ownerUsername, request, documents);
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<String> deleteStaff(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @PathVariable Long id
    ) {
        return ownerService.deleteStaff(ownerUsername, id);
    }

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemRow>> listMenu(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.listMenu(ownerUsername);
    }

    @PostMapping("/menu")
    public ResponseEntity<MenuItemRow> createMenuItem(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestBody MenuItemRequest request
    ) {
        return ownerService.createMenuItem(ownerUsername, request);
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuItemRow> updateMenuItem(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @PathVariable Long id,
            @RequestBody MenuItemRequest request
    ) {
        return ownerService.updateMenuItem(ownerUsername, id, request);
    }

    @PostMapping(value = "/menu/{id}/image", consumes = {"multipart/form-data"})
    public ResponseEntity<MenuItemRow> uploadMenuItemImage(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file
    ) {
        return ownerService.uploadMenuItemImage(ownerUsername, id, file);
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<String> deleteMenuItem(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @PathVariable Long id
    ) {
        return ownerService.deleteMenuItem(ownerUsername, id);
    }

    @GetMapping("/capacities")
    public ResponseEntity<List<FunctionCapacityRow>> listCapacities(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.listCapacities(ownerUsername);
    }

    @PostMapping("/capacities")
    public ResponseEntity<FunctionCapacityRow> upsertCapacity(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestBody FunctionCapacityRequest request
    ) {
        return ownerService.upsertCapacity(ownerUsername, request);
    }

    @DeleteMapping("/capacities/{id}")
    public ResponseEntity<String> deleteCapacity(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @PathVariable Long id
    ) {
        return ownerService.deleteCapacity(ownerUsername, id);
    }

    @GetMapping("/images")
    public ResponseEntity<List<CafeImageRow>> listImages(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.listImages(ownerUsername);
    }

    @PostMapping(value = "/images", consumes = {"multipart/form-data"})
    public ResponseEntity<CafeImageRow> uploadImage(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "cover", required = false) Boolean cover
    ) {
        return ownerService.uploadImage(ownerUsername, file, cover);
    }

    @DeleteMapping("/images/{id}")
    public ResponseEntity<String> deleteImage(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername,
            @PathVariable Long id
    ) {
        return ownerService.deleteImage(ownerUsername, id);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<CafeBookingRow>> listBookings(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.listBookings(ownerUsername);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<CafeOrderRow>> listOrders(
            @RequestHeader(value = "X-USERNAME", required = false) String ownerUsername
    ) {
        return ownerService.listOrders(ownerUsername);
    }
}
