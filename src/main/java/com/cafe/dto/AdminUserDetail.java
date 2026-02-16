package com.cafe.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserDetail {

    private Long id;
    private String username;
    private String role;
    private String approvalStatus;
    private Boolean forcePasswordChange;

    private PersonalDetailsDto personalDetails;
    private AddressDto address;
    private List<AcademicInfoDto> academicInfoList;
    private List<WorkExperienceDto> workExperienceList;
    private List<AdminDocumentRow> documents;

    @Getter
    @Setter
    public static class PersonalDetailsDto {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String contactNo;
        private String gender;
        private String maritalStatus;
    }

    @Getter
    @Setter
    public static class AddressDto {
        private Long id;
        private String street;
        private String city;
        private String state;
        private String pincode;
    }

    @Getter
    @Setter
    public static class AcademicInfoDto {
        private Long id;
        private String institutionName;
        private String degree;
        private int passingYear;
        private String grade;
        private double gradeInPercentage;
    }

    @Getter
    @Setter
    public static class WorkExperienceDto {
        private Long id;
        private String startDate;
        private String endDate;
        private boolean currentlyWorking;
        private String companyName;
        private String designation;
        private double ctc;
        private String reasonForLeaving;
    }
}
