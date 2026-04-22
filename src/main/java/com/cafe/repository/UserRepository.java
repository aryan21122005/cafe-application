package com.cafe.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cafe.entity.Role;
import com.cafe.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u JOIN u.personalDetails pd WHERE pd.email = :email")
    Optional<User> findByPersonalDetailsEmail(@Param("email") String email);

    @Query("SELECT u FROM User u JOIN u.personalDetails pd WHERE pd.phone = :phone")
    Optional<User> findByPersonalDetailsPhone(@Param("phone") String phone);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u JOIN u.personalDetails pd WHERE pd.email = :email")
    boolean existsByPersonalDetailsEmail(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u JOIN u.personalDetails pd WHERE pd.phone = :phone")
    boolean existsByPersonalDetailsPhone(@Param("phone") String phone);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.role = :role")
    boolean existsByRole(@Param("role") Role role);
}
