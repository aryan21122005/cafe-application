package com.cafe.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServeOrderRequest {

    @NotBlank(message = "Allocated table is required")
    private String allocatedTable;
}
