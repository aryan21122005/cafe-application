package com.cafe.controller;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cafe.dto.AvailableTablesResponse;
import com.cafe.dto.CafeAmenityRow;
import com.cafe.dto.CafeImageRow;
import com.cafe.dto.CafeProfileResponse;
import com.cafe.dto.MenuItemRow;
import com.cafe.dto.PublicCafeCardRow;
import com.cafe.entity.ApprovalStatus;
import com.cafe.entity.Cafe;
import com.cafe.entity.CafeAmenity;
import com.cafe.entity.CafeImage;
import com.cafe.entity.FunctionCapacity;
import com.cafe.entity.FunctionType;
import com.cafe.entity.MenuItem;
import com.cafe.repository.CafeAmenityRepository;
import com.cafe.repository.CafeBookingRepository;
import com.cafe.repository.CafeImageRepository;
import com.cafe.repository.CafeRepository;
import com.cafe.repository.FunctionCapacityRepository;
import com.cafe.repository.MenuItemRepository;

@RestController
@RequestMapping("/api/public")
public class PublicCafeController {

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CafeImageRepository cafeImageRepository;

    @Autowired
    private CafeAmenityRepository cafeAmenityRepository;

    @Autowired
    private FunctionCapacityRepository functionCapacityRepository;

    @Autowired
    private CafeBookingRepository cafeBookingRepository;

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

    @GetMapping("/cafes/{id}/amenities")
    public ResponseEntity<List<CafeAmenityRow>> listCafeAmenities(
            @PathVariable Long id,
            @RequestParam(value = "functionType", required = false) String functionType
    ) {
        try {
            Cafe cafe = requireApprovedCafe(id);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            FunctionType ft = null;
            if (functionType != null && !functionType.isBlank()) {
                try {
                    ft = FunctionType.valueOf(functionType.trim());
                } catch (Exception ex) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
            }

            List<CafeAmenity> list;
            if (ft == null) {
                list = cafeAmenityRepository.findByCafeIdAndEnabledOrderByCreatedAtDesc(cafe.getId(), true);
            } else {
                list = cafeAmenityRepository.findByCafeIdAndFunctionTypeAndEnabledOrderByCreatedAtDesc(cafe.getId(), ft, true);
                List<CafeAmenity> global = cafeAmenityRepository.findByCafeIdAndFunctionTypeAndEnabledOrderByCreatedAtDesc(cafe.getId(), null, true);
                if (global != null && !global.isEmpty()) {
                    List<CafeAmenity> merged = new ArrayList<>();
                    if (list != null) merged.addAll(list);
                    merged.addAll(global);
                    list = merged;
                }
            }

            List<CafeAmenityRow> rows = (list == null ? List.<CafeAmenityRow>of() : list.stream()
                    .filter(a -> a != null)
                    .map(a -> {
                        CafeAmenityRow r = new CafeAmenityRow();
                        r.setId(a.getId());
                        r.setCafeId(a.getCafe() == null ? null : a.getCafe().getId());
                        r.setFunctionType(a.getFunctionType() == null ? null : a.getFunctionType().name());
                        r.setName(a.getName());
                        r.setEnabled(a.getEnabled());
                        r.setCreatedAt(a.getCreatedAt());
                        return r;
                    })
                    .toList());

            return ResponseEntity.ok(rows);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/cafes/{id}/available-tables")
    public ResponseEntity<AvailableTablesResponse> getAvailableTables(
            @PathVariable Long id,
            @RequestParam(value = "functionType") String functionType,
            @RequestParam(value = "bookingDate") String bookingDate,
            @RequestParam(value = "bookingTime") String bookingTime,
            @RequestParam(value = "guests", required = false) Integer guests,
            @RequestParam(value = "amenity", required = false) String amenity
    ) {
        try {
            Cafe cafe = requireApprovedCafe(id);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            if (functionType == null || functionType.isBlank() || bookingDate == null || bookingDate.isBlank() || bookingTime == null || bookingTime.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            FunctionType ft;
            try {
                ft = FunctionType.valueOf(functionType.trim());
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            if (amenity != null && !amenity.isBlank()) {
                String am = amenity.trim();
                List<CafeAmenity> enabled = cafeAmenityRepository.findByCafeIdAndEnabledOrderByCreatedAtDesc(cafe.getId(), true);
                boolean ok = false;
                if (enabled != null) {
                    for (CafeAmenity a : enabled) {
                        if (a == null || a.getName() == null) continue;
                        if (!a.getName().trim().equalsIgnoreCase(am)) continue;
                        if (a.getFunctionType() == null || ft.equals(a.getFunctionType())) {
                            ok = true;
                            break;
                        }
                    }
                }
                if (!ok) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
            }

            FunctionCapacity cap = functionCapacityRepository.findByCafeIdAndFunctionType(cafe.getId(), ft).orElse(null);
            if (cap == null || !Boolean.TRUE.equals(cap.getEnabled())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            List<String> labels = parseDistinctCsv(cap.getTableLabels());
            if (labels.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            String bd = bookingDate.trim();
            String bt = bookingTime.trim();

            List<String> used = cafeBookingRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId()).stream()
                    .filter(b -> b != null
                            && ft.equals(b.getFunctionType())
                            && "APPROVED".equalsIgnoreCase(String.valueOf(b.getStatus()))
                            && b.getBookingDate() != null
                            && b.getBookingTime() != null
                            && b.getBookingDate().trim().equalsIgnoreCase(bd)
                            && b.getBookingTime().trim().equalsIgnoreCase(bt)
                            && b.getAllocatedTable() != null
                            && !b.getAllocatedTable().isBlank())
                    .flatMap(b -> parseDistinctCsv(b.getAllocatedTable()).stream())
                    .toList();

            List<String> available = labels.stream().filter(t -> !used.contains(t)).toList();

            AvailableTablesResponse res = new AvailableTablesResponse();
            res.setCafeId(cafe.getId());
            res.setFunctionType(ft.name());
            res.setBookingDate(bd);
            res.setBookingTime(bt);
            res.setSeatsPerTable(cap.getSeatsPerTable());
            res.setTablesNeeded(computeTablesNeeded(guests, cap.getSeatsPerTable()));
            res.setAvailableTables(available);
            return ResponseEntity.ok(res);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private List<String> parseDistinctCsv(String raw) {
        List<String> out = new ArrayList<>();
        if (raw == null || raw.isBlank()) return out;
        for (String part : raw.split(",")) {
            if (part == null) continue;
            String t = part.trim();
            if (t.isBlank()) continue;
            if (!out.contains(t)) out.add(t);
        }
        return out;
    }

    private int computeTablesNeeded(Integer guests, Integer seatsPerTable) {
        int g = (guests == null ? 0 : guests);
        if (g <= 0) return 1;
        int spt = (seatsPerTable == null ? 0 : seatsPerTable);
        if (spt <= 0) return 1;
        return (int) Math.ceil((double) g / (double) spt);
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

        List<String> urls = new ArrayList<>();
        if (cover != null) {
            urls.add("/api/public/cafe-images/" + cover.getId());
        }
        imgs.stream()
                .filter(i -> i != null && (cover == null || !i.getId().equals(cover.getId())))
                .sorted(Comparator.comparing(CafeImage::getId))
                .limit(4)
                .forEach(i -> urls.add("/api/public/cafe-images/" + i.getId()));
        r.setImageUrls(urls);
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
