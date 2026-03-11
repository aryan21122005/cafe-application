package com.cafe.dto;

import java.util.List;

public class AvailableTablesResponse {

    private Long cafeId;

    private String functionType;

    private String bookingDate;

    private String bookingTime;

    private Integer seatsPerTable;

    private Integer tablesNeeded;

    private List<String> availableTables;

    public Long getCafeId() {
        return cafeId;
    }

    public void setCafeId(Long cafeId) {
        this.cafeId = cafeId;
    }

    public String getFunctionType() {
        return functionType;
    }

    public void setFunctionType(String functionType) {
        this.functionType = functionType;
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

    public Integer getSeatsPerTable() {
        return seatsPerTable;
    }

    public void setSeatsPerTable(Integer seatsPerTable) {
        this.seatsPerTable = seatsPerTable;
    }

    public Integer getTablesNeeded() {
        return tablesNeeded;
    }

    public void setTablesNeeded(Integer tablesNeeded) {
        this.tablesNeeded = tablesNeeded;
    }

    public List<String> getAvailableTables() {
        return availableTables;
    }

    public void setAvailableTables(List<String> availableTables) {
        this.availableTables = availableTables;
    }
}
