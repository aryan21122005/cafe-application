package com.cafe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RazorpayConfirmBookingFoodOrderRequest {

    @NotNull
    @Valid
    private CafeOrderRequest order;

    @NotNull
    @Valid
    private RazorpayVerifyPaymentRequest payment;
}
