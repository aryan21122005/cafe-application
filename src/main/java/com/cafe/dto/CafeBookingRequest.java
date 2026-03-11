package com.cafe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CafeBookingRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    @NotBlank(message = "Booking date is required")
    private String bookingDate;

    @NotBlank(message = "Booking time is required")
    private String bookingTime;

    @NotNull(message = "Guests is required")
    @Positive(message = "Guests must be positive")
    private Integer guests;

    @NotBlank(message = "Note is required")
    private String note;

    private String amenityPreference;

    private String allocatedTable;

    @NotBlank(message = "Function type is required")
    private String functionType;

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

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
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

    public String getFunctionType() {
        return functionType;
    }

    public void setFunctionType(String functionType) {
        this.functionType = functionType;
    }
}
