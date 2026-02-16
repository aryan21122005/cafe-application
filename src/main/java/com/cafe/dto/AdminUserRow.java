package com.cafe.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserRow {

    private Long id;
    private String username;
    private String role;
    private String approvalStatus;
    private String email;
    private String phone;

    private List<AdminDocumentRow> documents;
}
