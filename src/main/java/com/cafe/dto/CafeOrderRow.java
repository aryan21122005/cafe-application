package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CafeOrderRow {

    private Long id;
    private Long cafeId;
    private String cafeName;

    private String customerName;
    private String customerPhone;
    private String status;
    private Double totalAmount;
    private String amenityPreference;
    private String allocatedTable;
    private Long createdAt;

    private List<CafeOrderItemRow> items;
}
