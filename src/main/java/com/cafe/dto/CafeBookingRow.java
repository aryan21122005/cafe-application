package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeBookingRow {

    private Long id;
    private Long cafeId;
    private String cafeName;

    private String customerName;
    private String customerPhone;
    private String bookingDate;
    private String bookingTime;
    private Integer guests;
    private String note;
    private String status;
    private Long createdAt;
}
