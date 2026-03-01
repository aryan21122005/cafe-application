package com.cafe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FunctionCapacityRequest {

    @NotBlank(message = "Function type is required")
    private String functionType;

    @NotNull(message = "Tables available is required")
    @PositiveOrZero(message = "Tables available must be zero or positive")
    private Integer tablesAvailable;

    @NotNull(message = "Seats available is required")
    @PositiveOrZero(message = "Seats available must be zero or positive")
    private Integer seatsAvailable;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must be zero or positive")
    private Double price;

    @NotNull(message = "Enabled status is required")
    private Boolean enabled;
}
