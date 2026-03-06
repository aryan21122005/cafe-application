package com.cafe.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "cafe_bookings")
public class CafeBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;

    @Column
    private String customerUsername;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    @Column(nullable = false)
    private String bookingDate;

    @Column(nullable = false)
    private String bookingTime;

    @Column(nullable = false)
    private Integer guests;

    private String note;

    private String amenityPreference;

    private String allocatedTable;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private String paymentStatus = "UNPAID";

    private String razorpayOrderId;

    private String razorpayPaymentId;

    private Long paidAt;

    private String denialReason;

    @Column(nullable = false)
    private Long createdAt = System.currentTimeMillis();
}
