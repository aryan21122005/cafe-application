package com.cafe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeProfileRequest {

    @NotBlank(message = "Cafe name is required")
    private String cafeName;

    @NotBlank(message = "Owner names are required")
    private String ownerNames;

    @NotBlank(message = "POC designation is required")
    private String pocDesignation;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "WhatsApp number is required")
    private String whatsappNumber;

    @NotBlank(message = "Address line is required")
    private String addressLine;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Pincode is required")
    private String pincode;

    @NotBlank(message = "Opening time is required")
    private String openingTime;

    @NotBlank(message = "Closing time is required")
    private String closingTime;

    @NotBlank(message = "FSSAI number is required")
    private String fssaiNumber;

    @NotBlank(message = "PAN number is required")
    private String panNumber;

    @NotBlank(message = "GSTIN is required")
    private String gstin;

    @NotBlank(message = "Shop license number is required")
    private String shopLicenseNumber;

    @NotBlank(message = "Bank account number is required")
    private String bankAccountNumber;

    @NotBlank(message = "Bank IFSC is required")
    private String bankIfsc;

    @NotBlank(message = "Bank account holder name is required")
    private String bankAccountHolderName;

    @NotNull(message = "Active status is required")
    private Boolean active;
}
