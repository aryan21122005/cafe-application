package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {

    private String username;
    private String role;
    private Boolean forcePasswordChange;
}
