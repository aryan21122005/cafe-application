package com.cafe.repository;

import com.cafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    boolean existsByPersonalDetailsEmail(String email);

    boolean existsByPersonalDetailsPhone(String phone);
}
