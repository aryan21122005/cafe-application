package com.cafe.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MenuAvailabilityRequest {

    @NotNull(message = "Availability is required")
    private Boolean available;
}
