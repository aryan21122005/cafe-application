package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeOrderItemRow {

    private Long menuItemId;
    private String itemName;
    private Double price;
    private Integer qty;
}
