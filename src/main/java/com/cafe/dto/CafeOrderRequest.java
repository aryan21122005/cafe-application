package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CafeOrderRequest {

    private String customerName;
    private String customerPhone;
    private List<CafeOrderItemRequest> items;
}
