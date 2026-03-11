package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FunctionCapacityRow {

    private Long id;
    private String functionType;
    private Integer tablesAvailable;

    private String tableLabels;
    private Integer seatsPerTable;
    private Integer seatsAvailable;
    private Double price;
    private Boolean enabled;
}
