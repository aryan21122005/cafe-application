package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeProfileRequest {

    private String cafeName;

    private String ownerNames;

    private String pocDesignation;

    private String description;

    private String phone;

    private String email;

    private String whatsappNumber;

    private String addressLine;

    private String city;

    private String state;
    private String pincode;
    private String openingTime;

    private String closingTime;

    private String fssaiNumber;

    private String panNumber;

    private String gstin;

    private String shopLicenseNumber;

    private String bankAccountNumber;

    private String bankIfsc;

    private String bankAccountHolderName;

    private Boolean active;
}
