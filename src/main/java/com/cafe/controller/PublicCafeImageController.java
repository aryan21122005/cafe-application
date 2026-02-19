package com.cafe.controller;

import com.cafe.entity.CafeImage;
import com.cafe.repository.CafeImageRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/public")
public class PublicCafeImageController {

    @Autowired
    private CafeImageRepository cafeImageRepository;

    @GetMapping("/cafe-images/{id}")
    public ResponseEntity<?> getCafeImage(@PathVariable Long id) {
        try {
            CafeImage img = cafeImageRepository.findById(id).orElse(null);
            if (img == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
            }

            Path path = Path.of(img.getFilePath());
            if (!Files.exists(path)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
            }
            byte[] bytes = Files.readAllBytes(path);
            ByteArrayResource resource = new ByteArrayResource(bytes);
            MediaType mt;
            try {
                mt = img.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(img.getContentType());
            } catch (Exception ex) {
                mt = MediaType.APPLICATION_OCTET_STREAM;
            }
            return ResponseEntity.ok().contentType(mt).body(resource);
        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to read image");
        }
    }
}
