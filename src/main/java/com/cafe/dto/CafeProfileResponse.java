package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeProfileResponse {

    private Long id;
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

    private String ownerUsername;
}
