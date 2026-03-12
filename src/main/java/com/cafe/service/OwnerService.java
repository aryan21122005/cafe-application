package com.cafe.service;

import java.util.List;

import org.springframework.http.ResponseEntity;
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
import com.cafe.dto.OwnerStaffCreateRequest;
import com.cafe.dto.OwnerCafeRow;
import com.cafe.dto.OwnerStaffRow;

public interface OwnerService {

    ResponseEntity<List<OwnerCafeRow>> listCafes(String ownerUsername);

    ResponseEntity<CafeProfileResponse> getCafe(String ownerUsername, Long cafeId);

    ResponseEntity<AdminUserDetail> getMe(String ownerUsername);

    ResponseEntity<CafeProfileResponse> upsertCafe(String ownerUsername, Long cafeId, CafeProfileRequest request);

    ResponseEntity<CafeProfileResponse> upsertCafeWithDocuments(String ownerUsername, Long cafeId, CafeProfileRequest request, List<String> docKeys, List<MultipartFile> documents);

    ResponseEntity<String> deleteCafe(String ownerUsername, Long cafeId);

    ResponseEntity<List<CafeDocumentRow>> listCafeDocuments(String ownerUsername, Long cafeId);

    ResponseEntity<CafeDocumentRow> uploadCafeDocument(String ownerUsername, Long cafeId, String docKey, MultipartFile file);

    ResponseEntity<byte[]> downloadCafeDocument(String ownerUsername, Long cafeId, Long id);

    ResponseEntity<List<OwnerStaffRow>> listStaff(String ownerUsername, Long cafeId);

    ResponseEntity<String> createStaff(String ownerUsername, Long cafeId, OwnerStaffCreateRequest request);

    ResponseEntity<String> createStaffWithDocuments(String ownerUsername, Long cafeId, OwnerStaffCreateRequest request, List<MultipartFile> documents);

    ResponseEntity<String> deleteStaff(String ownerUsername, Long cafeId, Long id);

    ResponseEntity<List<MenuItemRow>> listMenu(String ownerUsername, Long cafeId);

    ResponseEntity<MenuItemRow> createMenuItem(String ownerUsername, Long cafeId, MenuItemRequest request);

    ResponseEntity<MenuItemRow> updateMenuItem(String ownerUsername, Long cafeId, Long id, MenuItemRequest request);

    ResponseEntity<MenuItemRow> updateMenuAvailability(String ownerUsername, Long cafeId, Long id, MenuAvailabilityRequest request);

    ResponseEntity<MenuItemRow> uploadMenuItemImage(String ownerUsername, Long cafeId, Long id, MultipartFile file);

    ResponseEntity<String> deleteMenuItem(String ownerUsername, Long cafeId, Long id);

    ResponseEntity<List<FunctionCapacityRow>> listCapacities(String ownerUsername, Long cafeId);

    ResponseEntity<FunctionCapacityRow> upsertCapacity(String ownerUsername, Long cafeId, FunctionCapacityRequest request);

    ResponseEntity<String> deleteCapacity(String ownerUsername, Long cafeId, Long id);

    ResponseEntity<List<CafeImageRow>> listImages(String ownerUsername, Long cafeId);

    ResponseEntity<CafeImageRow> uploadImage(String ownerUsername, Long cafeId, MultipartFile file, Boolean cover);

    ResponseEntity<String> deleteImage(String ownerUsername, Long cafeId, Long id);

    ResponseEntity<List<CafeBookingRow>> listBookings(String ownerUsername, Long cafeId);

    ResponseEntity<CafeBookingRow> approveBooking(String ownerUsername, Long cafeId, Long bookingId);

    ResponseEntity<CafeBookingRow> denyBooking(String ownerUsername, Long cafeId, Long bookingId, BookingDecisionRequest request);

    ResponseEntity<CafeBookingRow> denyBookingWithRefund(String ownerUsername, Long cafeId, Long bookingId, BookingDecisionRequest request);

    ResponseEntity<String> deleteBooking(String ownerUsername, Long cafeId, Long bookingId);

    ResponseEntity<List<CafeOrderRow>> listOrders(String ownerUsername, Long cafeId);

    ResponseEntity<String> deleteOrder(String ownerUsername, Long cafeId, Long orderId);

    ResponseEntity<List<CafeAmenityRow>> listAmenities(String ownerUsername, Long cafeId);

    ResponseEntity<CafeAmenityRow> createAmenity(String ownerUsername, Long cafeId, CafeAmenityRequest request);

    ResponseEntity<CafeAmenityRow> updateAmenity(String ownerUsername, Long cafeId, Long id, CafeAmenityRequest request);

    ResponseEntity<String> deleteAmenity(String ownerUsername, Long cafeId, Long id);

    ResponseEntity<AdminAnalyticsSummary> getAnalyticsSummary(String ownerUsername, Long cafeId);

    ResponseEntity<AdminAnalyticsDetailsResponse> getAnalyticsDetails(String ownerUsername, Long cafeId);
}
