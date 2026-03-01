package com.cafe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CafeOrderRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    @Valid
    @NotEmpty(message = "Items are required")
    private List<CafeOrderItemRequest> items;

    private String amenityPreference;
}
