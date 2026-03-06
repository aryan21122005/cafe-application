package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RazorpayCreateOrderResponse {

    private Long cafeOrderId;
    private Integer orderNumber;

    private String razorpayKeyId;
    private String razorpayOrderId;

    private Long amountPaise;
    private String currency;

    private String cafeName;
    private String customerName;
    private String customerPhone;
}
