package com.cafe.service;

public interface EmailService {
    void sendCredentials(String toEmail, String username, String tempPassword);

    void sendDenied(String toEmail, String reason);
}
