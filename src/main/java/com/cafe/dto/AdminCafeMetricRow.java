package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCafeMetricRow {

    private Long cafeId;
    private String cafeName;
    private String city;

    private Long orderCount;
    private Double orderRevenue;
}
