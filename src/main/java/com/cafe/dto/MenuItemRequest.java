package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MenuItemRequest {

    private String name;
    private String description;
    private Double price;
    private Boolean available;
    private String category;
}
