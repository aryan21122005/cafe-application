package com.cafe.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingDecisionRequest {

    @NotBlank(message = "Reason is required")
    private String reason;
}
