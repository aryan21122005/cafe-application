package com.cafe.controller;

import com.cafe.dto.CafeImageRow;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.PublicCafeCardRow;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeImage;
import com.cafe.entity.MenuItem;
import com.cafe.repository.CafeImageRepository;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicCafeController {

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CafeImageRepository cafeImageRepository;

    @GetMapping("/cafes")
    public ResponseEntity<List<PublicCafeCardRow>> listCafes() {
        try {
            List<Cafe> cafes = cafeRepository.findByApprovalStatus(ApprovalStatus.APPROVED);
            List<PublicCafeCardRow> rows = cafes.stream()
                    .filter(c -> c != null && Boolean.TRUE.equals(c.getActive()))
                    .map(this::toCardRow)
                    .toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/cafes/{id}")
    public ResponseEntity<CafeProfileResponse> getCafeDetail(@PathVariable Long id) {
        try {
            Cafe cafe = requireApprovedCafe(id);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.ok(toCafeResponse(cafe));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/cafes/{id}/menu")
    public ResponseEntity<List<MenuItemRow>> listCafeMenu(@PathVariable Long id) {
        try {
            Cafe cafe = requireApprovedCafe(id);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            List<MenuItem> items = menuItemRepository.findByCafeId(cafe.getId());
            List<MenuItemRow> rows = items.stream().map(this::toMenuRow).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/cafes/{id}/images")
    public ResponseEntity<List<CafeImageRow>> listCafeImages(@PathVariable Long id) {
        try {
            Cafe cafe = requireApprovedCafe(id);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            List<CafeImage> imgs = cafeImageRepository.findByCafeId(cafe.getId());
            List<CafeImageRow> rows = imgs.stream().map(this::toImageRow).toList();
            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private Cafe requireApprovedCafe(Long id) {
        if (id == null) return null;
        Cafe cafe = cafeRepository.findById(id).orElse(null);
        if (cafe == null) return null;
        if (!Boolean.TRUE.equals(cafe.getActive())) return null;
        if (cafe.getApprovalStatus() == null || cafe.getApprovalStatus() != ApprovalStatus.APPROVED) return null;
        return cafe;
    }

    private PublicCafeCardRow toCardRow(Cafe cafe) {
        PublicCafeCardRow r = new PublicCafeCardRow();
        r.setId(cafe.getId());
        r.setCafeName(cafe.getCafeName());
        r.setCity(cafe.getCity());
        r.setState(cafe.getState());
        r.setActive(cafe.getActive());
        r.setApprovalStatus(cafe.getApprovalStatus() == null ? null : cafe.getApprovalStatus().name());

        List<CafeImage> imgs = cafeImageRepository.findByCafeId(cafe.getId());
        CafeImage cover = imgs.stream()
                .filter(i -> i != null && Boolean.TRUE.equals(i.getCover()))
                .findFirst()
                .orElseGet(() -> imgs.stream().filter(i -> i != null).min(Comparator.comparing(CafeImage::getId)).orElse(null));
        if (cover != null) {
            r.setCoverImageUrl("/api/public/cafe-images/" + cover.getId());
        }
        return r;
    }

    private CafeProfileResponse toCafeResponse(Cafe cafe) {
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

    private CafeImageRow toImageRow(CafeImage img) {
        CafeImageRow r = new CafeImageRow();
        r.setId(img.getId());
        r.setFilename(img.getFilename());
        r.setContentType(img.getContentType());
        r.setSize(img.getSize());
        r.setCover(img.getCover());
        r.setUrl("/api/public/cafe-images/" + img.getId());
        return r;
    }
}
