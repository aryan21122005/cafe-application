package com.cafe.dto;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.Address;
import com.cafe.entity.AcademicInfo;
import com.cafe.entity.WorkExperience;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    private String role;

    private String username;
    private String password;

    private PersonalDetails personalDetails;
    private Address address;
    private List<AcademicInfo> academicInfoList;
    private List<WorkExperience> workExperienceList;
}
