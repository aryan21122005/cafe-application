package com.cafe.dto;

import jakarta.validation.constraints.NotBlank;

public class CafeAmenityRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String functionType;

    private Boolean enabled;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFunctionType() {
        return functionType;
    }

    public void setFunctionType(String functionType) {
        this.functionType = functionType;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
