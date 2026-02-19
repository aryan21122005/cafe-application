package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OwnerStaffRow {

    private Long id;
    private String username;
    private String role;
    private String approvalStatus;
    private String email;
    private String phone;
}
