package com.cafe.entity;

import jakarta.persistence.*;
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

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private Long createdAt = System.currentTimeMillis();
}
