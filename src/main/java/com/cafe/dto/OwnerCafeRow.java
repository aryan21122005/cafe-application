package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OwnerCafeRow {

    private Long id;
    private String cafeName;
    private String city;
    private String state;
    private Boolean active;
    private String approvalStatus;
}
