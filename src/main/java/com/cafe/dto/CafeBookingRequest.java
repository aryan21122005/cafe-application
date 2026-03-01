package com.cafe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeBookingRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    @NotBlank(message = "Booking date is required")
    private String bookingDate;

    @NotBlank(message = "Booking time is required")
    private String bookingTime;

    @NotNull(message = "Guests is required")
    @Positive(message = "Guests must be positive")
    private Integer guests;

    @NotBlank(message = "Note is required")
    private String note;

    private String amenityPreference;
}
