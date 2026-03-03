package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCityMetricRow {

    private String city;
    private Long orderCount;
    private Double orderRevenue;
}
