package com.cafe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CafeImageRow {

    private Long id;
    private String filename;
    private String contentType;
    private Long size;
    private Boolean cover;
    private String url;
}
