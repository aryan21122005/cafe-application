package com.cafe.service;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import com.cafe.dto.AdminAnalyticsDetailsResponse;
import com.cafe.dto.AdminAnalyticsSummary;
import com.cafe.dto.AdminCafeRow;
import com.cafe.dto.AdminDecisionRequest;
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

public interface AdminService {

    ResponseEntity<List<AdminUserRow>> listUsers();

    ResponseEntity<List<AdminCafeRow>> listCafes();

    ResponseEntity<List<AdminOwnerRow>> listOwners();

    ResponseEntity<String> createOwner(RegisterRequest request, List<MultipartFile> documents);

    ResponseEntity<AdminCafeRow> createCafeForOwner(String ownerUsername, CafeProfileRequest request);

    ResponseEntity<CafeProfileResponse> getCafeDetail(Long cafeId);

    ResponseEntity<CafeProfileResponse> updateCafeProfile(Long cafeId, CafeProfileRequest request);

    ResponseEntity<AdminCafeRow> approveCafe(Long cafeId);

    ResponseEntity<List<MenuItemRow>> listCafeMenu(Long cafeId);

    ResponseEntity<MenuItemRow> createCafeMenuItem(Long cafeId, MenuItemRequest request);

    ResponseEntity<MenuItemRow> updateCafeMenuItem(Long cafeId, Long menuItemId, MenuItemRequest request);

    ResponseEntity<MenuItemRow> updateCafeMenuItemAvailability(Long cafeId, Long menuItemId, MenuAvailabilityRequest request);

    ResponseEntity<MenuItemRow> uploadCafeMenuItemImage(Long cafeId, Long menuItemId, MultipartFile file);

    ResponseEntity<String> deleteCafeMenuItem(Long cafeId, Long menuItemId);

    ResponseEntity<String> deleteCafe(Long cafeId);

    ResponseEntity<List<CafeImageRow>> listCafeImages(Long cafeId);

    ResponseEntity<CafeImageRow> uploadCafeImage(Long cafeId, MultipartFile file, Boolean cover);

    ResponseEntity<String> deleteCafeImage(Long cafeId, Long imageId);

    ResponseEntity<List<CafeDocumentRow>> listCafeDocuments(Long cafeId);

    ResponseEntity<CafeDocumentRow> uploadCafeDocument(Long cafeId, String docKey, MultipartFile file);

    ResponseEntity<byte[]> downloadCafeDocument(Long id);

    ResponseEntity<AdminUserDetail> getUserDetail(Long id);

    ResponseEntity<AdminUserDetail> getUserDetailByUsername(String username);

    ResponseEntity<String> approveUser(Long id);

    ResponseEntity<String> denyUser(Long id, AdminDecisionRequest request);

    ResponseEntity<String> deleteUser(Long id);

    ResponseEntity<byte[]> downloadDocument(Long id);

    ResponseEntity<byte[]> exportCafeHistoryExcel(Long cafeId);

    ResponseEntity<byte[]> exportCafeMenuExcel(Long cafeId);

    ResponseEntity<AdminAnalyticsSummary> getAnalyticsSummary();

    ResponseEntity<AdminAnalyticsDetailsResponse> getAnalyticsDetails();
}
