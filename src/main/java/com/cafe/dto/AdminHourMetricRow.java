package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminHourMetricRow {

    private Integer hour;
    private Long orderCount;
    private Double orderRevenue;
}
