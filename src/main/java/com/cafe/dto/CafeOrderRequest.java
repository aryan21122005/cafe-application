package com.cafe.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public class CafeOrderRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    @Valid
    @NotEmpty(message = "Items are required")
    private List<CafeOrderItemRequest> items;

    private String amenityPreference;

    private String allocatedTable;

    private String bookingDate;

    private String bookingTime;

    private Integer guests;

    private String functionType;

    private Long cafeId;

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public List<CafeOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CafeOrderItemRequest> items) {
        this.items = items;
    }

    public String getAmenityPreference() {
        return amenityPreference;
    }

    public void setAmenityPreference(String amenityPreference) {
        this.amenityPreference = amenityPreference;
    }

    public String getAllocatedTable() {
        return allocatedTable;
    }

    public void setAllocatedTable(String allocatedTable) {
        this.allocatedTable = allocatedTable;
    }

    public String getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(String bookingDate) {
        this.bookingDate = bookingDate;
    }

    public String getBookingTime() {
        return bookingTime;
    }

    public void setBookingTime(String bookingTime) {
        this.bookingTime = bookingTime;
    }

    public Integer getGuests() {
        return guests;
    }

    public void setGuests(Integer guests) {
        this.guests = guests;
    }

    public String getFunctionType() {
        return functionType;
    }

    public void setFunctionType(String functionType) {
        this.functionType = functionType;
    }

    public Long getCafeId() {
        return cafeId;
    }

    public void setCafeId(Long cafeId) {
        this.cafeId = cafeId;
    }
}
