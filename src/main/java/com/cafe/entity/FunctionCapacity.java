package com.cafe.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "function_capacities", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"cafe_id", "functionType"})
})
public class FunctionCapacity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FunctionType functionType;

    @Column(nullable = false)
    private Integer tablesAvailable;

    private Integer seatsAvailable;

    private Double price;

    @Column(nullable = false)
    private Boolean enabled = true;
}
