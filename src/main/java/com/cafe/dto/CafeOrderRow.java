package com.cafe.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeOrderRow {

    private Long id;
    private Integer orderNumber;
    private Long cafeId;
    private String cafeName;

    private String customerUsername;

    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String status;
    private Double totalAmount;

    private String ownerNames;

    private String paymentStatus;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private Long paidAt;
    private String amenityPreference;
    private String allocatedTable;
    private Long createdAt;

    private List<CafeOrderItemRow> items;
}
