package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FunctionCapacityRequest {

    private String functionType;
    private Integer tablesAvailable;
    private Integer seatsAvailable;
    private Double price;
    private Boolean enabled;
}
