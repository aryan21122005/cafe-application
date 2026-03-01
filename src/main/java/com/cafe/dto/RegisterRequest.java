package com.cafe.dto;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.Address;
import com.cafe.entity.AcademicInfo;
import com.cafe.entity.WorkExperience;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank(message = "Role is required")
    private String role;

    private String username;

    private String password;

    @Valid
    @NotNull(message = "Personal details are required")
    private PersonalDetails personalDetails;

    @Valid
    @NotNull(message = "Address is required")
    private Address address;

    @NotNull(message = "Academic information is required")
    private List<AcademicInfo> academicInfoList;

    @NotNull(message = "Work experience is required")
    private List<WorkExperience> workExperienceList;
}
