package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeOrderItemRequest {

    private Long menuItemId;
    private Integer qty;
}
