package com.cafe.service.impl;

import com.cafe.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Override
    public void sendCredentials(String toEmail, String username, String tempPassword) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Skipping credentials email: recipient email is blank");
            return;
        }
        if (mailSender == null) {
            log.warn("Skipping credentials email: JavaMailSender bean not available");
            return;
        }

        SimpleMailMessage msg = new SimpleMailMessage();
        if (fromEmail != null && !fromEmail.isBlank()) {
            msg.setFrom(fromEmail);
        }
        msg.setTo(toEmail);
        msg.setSubject("Your Digital Cafe login credentials");
        msg.setText(
                "Welcome to Digital Cafe.\n\n" +
                        "Username: " + username + "\n" +
                        "Temporary Password: " + tempPassword + "\n\n" +
                        "For security, you will be asked to change your password when you log in for the first time."
        );

        try {
            mailSender.send(msg);
        } catch (RuntimeException ex) {
            log.warn("Failed to send credentials email to {}", toEmail, ex);
            return;
        }
    }

    @Override
    public void sendDenied(String toEmail, String reason) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Skipping denial email: recipient email is blank");
            return;
        }
        if (mailSender == null) {
            log.warn("Skipping denial email: JavaMailSender bean not available");
            return;
        }

        String safeReason = reason == null ? "" : reason.trim();

        SimpleMailMessage msg = new SimpleMailMessage();
        if (fromEmail != null && !fromEmail.isBlank()) {
            msg.setFrom(fromEmail);
        }
        msg.setTo(toEmail);
        msg.setSubject("Your Digital Cafe registration status");
        msg.setText(
                "Your registration was reviewed and was not approved." +
                        (safeReason.isBlank() ? "" : ("\n\nReason: " + safeReason))
        );

        try {
            mailSender.send(msg);
        } catch (RuntimeException ex) {
            log.warn("Failed to send denial email to {}", toEmail, ex);
            return;
        }
    }
}
