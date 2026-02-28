package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeBookingRequest {

    private String customerName;
    private String customerPhone;
    private String bookingDate;
    private String bookingTime;
    private Integer guests;
    private String note;
}
