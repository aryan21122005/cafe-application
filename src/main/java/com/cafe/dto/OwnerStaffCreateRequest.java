package com.cafe.dto;

import com.cafe.entity.AcademicInfo;
import com.cafe.entity.Address;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.WorkExperience;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OwnerStaffCreateRequest {

    private String role;
    private String username;
    private String password;
    private PersonalDetails personalDetails;
    private Address address;
    private List<AcademicInfo> academicInfoList;
    private List<WorkExperience> workExperienceList;
}
