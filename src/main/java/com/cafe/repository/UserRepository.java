package com.cafe.repository;

import com.cafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u JOIN u.personalDetails pd WHERE pd.email = :email")
    boolean existsByPersonalDetailsEmail(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u JOIN u.personalDetails pd WHERE pd.phone = :phone")
    boolean existsByPersonalDetailsPhone(@Param("phone") String phone);
}
