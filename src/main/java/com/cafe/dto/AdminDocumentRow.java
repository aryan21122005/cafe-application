package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminDocumentRow {

    private Long id;
    private String documentName;
    private String documentType;
    private Long size;
}
