package com.cafe.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "cafes")
public class Cafe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String cafeName;

    private String ownerNames;

    private String pocDesignation;

    private String description;

    private String phone;

    private String email;

    private String whatsappNumber;

    private String addressLine;

    private String city;

    private String state;

    private String pincode;

    private String openingTime;

    private String closingTime;

    private String fssaiNumber;

    private String panNumber;

    private String gstin;

    private String shopLicenseNumber;

    private String bankAccountNumber;

    private String bankIfsc;

    private String bankAccountHolderName;

    @Column(nullable = false)
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany
    @JoinTable(
            name = "cafe_staff",
            joinColumns = @JoinColumn(name = "cafe_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> staff = new ArrayList<>();

    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CafeDocument> documents = new ArrayList<>();
}
