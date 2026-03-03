package com.cafe.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProfileUpdateRequest {

    private PersonalDetailsDto personalDetails;
    private AddressDto address;

    private List<AcademicInfoDto> academicInfoList;
    private List<WorkExperienceDto> workExperienceList;

    @Getter
    @Setter
    public static class PersonalDetailsDto {
        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Phone is required")
        private String phone;

        private String contactNo;
        private String gender;
        private String maritalStatus;
    }

    @Getter
    @Setter
    public static class AddressDto {
        @NotBlank(message = "Street is required")
        private String street;

        @NotBlank(message = "City is required")
        private String city;

        @NotBlank(message = "State is required")
        private String state;

        @NotBlank(message = "Pincode is required")
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
