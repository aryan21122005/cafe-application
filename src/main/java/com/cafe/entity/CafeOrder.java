package com.cafe.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "cafe_orders")
public class CafeOrder {

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
    private String status = "PLACED";

    @Column(nullable = false)
    private Double totalAmount = 0.0;

    private String amenityPreference;

    private String allocatedTable;

    @Column(nullable = false)
    private Long createdAt = System.currentTimeMillis();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CafeOrderItem> items = new ArrayList<>();
}
