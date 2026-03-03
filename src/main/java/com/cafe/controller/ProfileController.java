package com.cafe.controller;

import com.cafe.dto.AdminUserDetail;
import com.cafe.dto.ProfileUpdateRequest;
import com.cafe.entity.AcademicInfo;
import com.cafe.entity.Address;
import com.cafe.entity.PersonalDetails;
import com.cafe.entity.User;
import com.cafe.entity.WorkExperience;
import com.cafe.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<AdminUserDetail> me(
            @RequestHeader(value = "X-USERNAME", required = false) String username
    ) {
        try {
            User u = requireUser(username);
            if (u == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(toDetail(u));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/me")
    public ResponseEntity<AdminUserDetail> updateMe(
            @RequestHeader(value = "X-USERNAME", required = false) String username,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        try {
            User u = requireUser(username);
            if (u == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (request == null || request.getPersonalDetails() == null || request.getAddress() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            String email = request.getPersonalDetails().getEmail().trim();
            String phone = request.getPersonalDetails().getPhone().trim();

            User byEmail = userRepository.findByPersonalDetailsEmail(email).orElse(null);
            if (byEmail != null && byEmail.getId() != null && !byEmail.getId().equals(u.getId())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            User byPhone = userRepository.findByPersonalDetailsPhone(phone).orElse(null);
            if (byPhone != null && byPhone.getId() != null && !byPhone.getId().equals(u.getId())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            PersonalDetails pd = u.getPersonalDetails();
            if (pd == null) pd = new PersonalDetails();
            pd.setFirstName(request.getPersonalDetails().getFirstName().trim());
            pd.setLastName(request.getPersonalDetails().getLastName().trim());
            pd.setEmail(email);
            pd.setPhone(phone);
            pd.setContactNo(request.getPersonalDetails().getContactNo());
            pd.setGender(request.getPersonalDetails().getGender());
            pd.setMaritalStatus(request.getPersonalDetails().getMaritalStatus());
            u.setPersonalDetails(pd);

            Address a = u.getAddress();
            if (a == null) a = new Address();
            a.setStreet(request.getAddress().getStreet().trim());
            a.setCity(request.getAddress().getCity().trim());
            a.setState(request.getAddress().getState().trim());
            a.setPincode(request.getAddress().getPincode().trim());
            u.setAddress(a);

            List<AcademicInfo> newAcademics = new ArrayList<>();
            if (request.getAcademicInfoList() != null) {
                for (ProfileUpdateRequest.AcademicInfoDto ai : request.getAcademicInfoList()) {
                    if (ai == null) continue;
                    AcademicInfo e = new AcademicInfo();
                    e.setInstitutionName(ai.getInstitutionName());
                    e.setDegree(ai.getDegree());
                    e.setPassingYear(ai.getPassingYear());
                    e.setGrade(ai.getGrade());
                    e.setGradeInPercentage(ai.getGradeInPercentage());
                    newAcademics.add(e);
                }
            }
            u.setAcademicInfoList(newAcademics);

            List<WorkExperience> newWork = new ArrayList<>();
            if (request.getWorkExperienceList() != null) {
                for (ProfileUpdateRequest.WorkExperienceDto we : request.getWorkExperienceList()) {
                    if (we == null) continue;
                    WorkExperience e = new WorkExperience();
                    e.setStartDate(we.getStartDate());
                    e.setEndDate(we.getEndDate());
                    e.setCurrentlyWorking(we.isCurrentlyWorking());
                    e.setCompanyName(we.getCompanyName());
                    e.setDesignation(we.getDesignation());
                    e.setCtc(we.getCtc());
                    e.setReasonForLeaving(we.getReasonForLeaving());
                    newWork.add(e);
                }
            }
            u.setWorkExperienceList(newWork);

            userRepository.save(u);
            return ResponseEntity.ok(toDetail(u));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private User requireUser(String username) {
        if (username == null || username.isBlank()) return null;
        return userRepository.findByUsername(username.trim()).orElse(null);
    }

    private AdminUserDetail toDetail(User u) {
        AdminUserDetail d = new AdminUserDetail();
        d.setId(u.getId());
        d.setUsername(u.getUsername());
        d.setRole(u.getRole() == null ? null : u.getRole().name());
        d.setApprovalStatus(u.getApprovalStatus() == null ? null : u.getApprovalStatus().name());
        d.setForcePasswordChange(u.getForcePasswordChange());

        PersonalDetails pd = u.getPersonalDetails();
        if (pd != null) {
            AdminUserDetail.PersonalDetailsDto pdd = new AdminUserDetail.PersonalDetailsDto();
            pdd.setId(pd.getId());
            pdd.setFirstName(pd.getFirstName());
            pdd.setLastName(pd.getLastName());
            pdd.setEmail(pd.getEmail());
            pdd.setPhone(pd.getPhone());
            pdd.setContactNo(pd.getContactNo());
            pdd.setGender(pd.getGender());
            pdd.setMaritalStatus(pd.getMaritalStatus());
            d.setPersonalDetails(pdd);
        }

        Address a = u.getAddress();
        if (a != null) {
            AdminUserDetail.AddressDto ad = new AdminUserDetail.AddressDto();
            ad.setId(a.getId());
            ad.setStreet(a.getStreet());
            ad.setCity(a.getCity());
            ad.setState(a.getState());
            ad.setPincode(a.getPincode());
            d.setAddress(ad);
        }

        List<AdminUserDetail.AcademicInfoDto> academics = new ArrayList<>();
        if (u.getAcademicInfoList() != null) {
            for (AcademicInfo ai : u.getAcademicInfoList()) {
                if (ai == null) continue;
                AdminUserDetail.AcademicInfoDto aid = new AdminUserDetail.AcademicInfoDto();
                aid.setId(ai.getId());
                aid.setInstitutionName(ai.getInstitutionName());
                aid.setDegree(ai.getDegree());
                aid.setPassingYear(ai.getPassingYear());
                aid.setGrade(ai.getGrade());
                aid.setGradeInPercentage(ai.getGradeInPercentage());
                academics.add(aid);
            }
        }
        d.setAcademicInfoList(academics);

        List<AdminUserDetail.WorkExperienceDto> work = new ArrayList<>();
        if (u.getWorkExperienceList() != null) {
            for (WorkExperience we : u.getWorkExperienceList()) {
                if (we == null) continue;
                AdminUserDetail.WorkExperienceDto wed = new AdminUserDetail.WorkExperienceDto();
                wed.setId(we.getId());
                wed.setStartDate(we.getStartDate());
                wed.setEndDate(we.getEndDate());
                wed.setCurrentlyWorking(we.isCurrentlyWorking());
                wed.setCompanyName(we.getCompanyName());
                wed.setDesignation(we.getDesignation());
                wed.setCtc(we.getCtc());
                wed.setReasonForLeaving(we.getReasonForLeaving());
                work.add(wed);
            }
        }
        d.setWorkExperienceList(work);

        return d;
    }
}
