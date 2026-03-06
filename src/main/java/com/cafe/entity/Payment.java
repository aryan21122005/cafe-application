package com.cafe.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id")
    private CafeOrder order;

    @Column(nullable = false)
    private String provider = "RAZORPAY";

    @Column(nullable = false)
    private String currency = "INR";

    @Column(nullable = false)
    private Long amountPaise;

    private String razorpayOrderId;
    private String razorpayPaymentId;

    @Column(length = 512)
    private String razorpaySignature;

    @Column(nullable = false)
    private String status = "CREATED";

    @Column(nullable = false)
    private Long createdAt = System.currentTimeMillis();
}
