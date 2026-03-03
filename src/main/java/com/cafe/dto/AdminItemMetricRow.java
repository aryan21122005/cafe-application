package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminItemMetricRow {

    private Long menuItemId;
    private String itemName;

    private Long totalQty;
    private Double totalRevenue;
}
