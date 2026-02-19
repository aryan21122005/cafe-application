package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCafeRow {

    private Long id;
    private String cafeName;
    private Boolean active;
    private String ownerUsername;
    private String city;
    private String state;
}
