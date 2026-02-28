package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PublicCafeCardRow {

    private Long id;
    private String cafeName;
    private String city;
    private String state;
    private Boolean active;
    private String approvalStatus;
    private String coverImageUrl;
}
