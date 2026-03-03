package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AdminAnalyticsDetailsResponse {

    private AdminAnalyticsSummary summary;

    private List<AdminCafeMetricRow> topCafes;
    private List<AdminItemMetricRow> topItems;
    private List<AdminHourMetricRow> busyHours;
    private List<AdminCityMetricRow> citySales;
}
