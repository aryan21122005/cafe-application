package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminAnalyticsSummary {

    private Long totalCafes;
    private Long totalOrders;
    private Long totalBookings;
    private Double totalOrderRevenue;
}
