package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeDocumentRow {

    private Long id;
    private String docKey;
    private String documentName;
    private String documentType;
    private Long size;
}
