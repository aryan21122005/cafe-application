package com.cafe.service;

import com.cafe.dto.CafeProfileRequest;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.CafeImageRow;
import com.cafe.dto.FunctionCapacityRequest;
import com.cafe.dto.FunctionCapacityRow;
import com.cafe.dto.MenuItemRequest;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.OwnerStaffCreateRequest;
import com.cafe.dto.OwnerStaffRow;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface OwnerService {

    ResponseEntity<CafeProfileResponse> getCafe(String ownerUsername);

    ResponseEntity<CafeProfileResponse> upsertCafe(String ownerUsername, CafeProfileRequest request);

    ResponseEntity<String> deleteCafe(String ownerUsername);

    ResponseEntity<List<OwnerStaffRow>> listStaff(String ownerUsername);

    ResponseEntity<String> createStaff(String ownerUsername, OwnerStaffCreateRequest request);

    ResponseEntity<String> createStaffWithDocuments(String ownerUsername, OwnerStaffCreateRequest request, List<MultipartFile> documents);

    ResponseEntity<String> deleteStaff(String ownerUsername, Long id);

    ResponseEntity<List<MenuItemRow>> listMenu(String ownerUsername);

    ResponseEntity<MenuItemRow> createMenuItem(String ownerUsername, MenuItemRequest request);

    ResponseEntity<MenuItemRow> updateMenuItem(String ownerUsername, Long id, MenuItemRequest request);

    ResponseEntity<MenuItemRow> uploadMenuItemImage(String ownerUsername, Long id, MultipartFile file);

    ResponseEntity<String> deleteMenuItem(String ownerUsername, Long id);

    ResponseEntity<List<FunctionCapacityRow>> listCapacities(String ownerUsername);

    ResponseEntity<FunctionCapacityRow> upsertCapacity(String ownerUsername, FunctionCapacityRequest request);

    ResponseEntity<String> deleteCapacity(String ownerUsername, Long id);

    ResponseEntity<List<CafeImageRow>> listImages(String ownerUsername);

    ResponseEntity<CafeImageRow> uploadImage(String ownerUsername, MultipartFile file, Boolean cover);

    ResponseEntity<String> deleteImage(String ownerUsername, Long id);
}
