package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminOwnerRow {

    private Long id;
    private String username;
    private String email;
    private String phone;

    private String cafeName;
}
