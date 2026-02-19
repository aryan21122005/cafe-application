package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeProfileRequest {

    private String cafeName;
    private String description;
    private String phone;
    private String email;
    private String addressLine;
    private String city;
    private String state;
    private String pincode;
    private String openingTime;
    private String closingTime;
    private Boolean active;
}
