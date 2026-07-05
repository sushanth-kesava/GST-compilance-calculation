package com.smartretail360.service;

import com.smartretail360.dto.*;
import com.smartretail360.exception.CustomException;
import com.smartretail360.model.Role;
import com.smartretail360.model.User;
import com.smartretail360.repository.UserRepository;
import com.smartretail360.security.JwtTokenProvider;
import com.smartretail360.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_TIME_DURATION_SEC = 900; // 15 mins

    public User registerUser(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new CustomException("Username is already taken", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException("Email Address already in use", HttpStatus.BAD_REQUEST);
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            roles.add(Role.ROLE_CASHIER); // default role
        } else {
            roles.addAll(request.getRoles());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .roles(roles)
                .active(true)
                .verified(true) // Auto-verified, no OTP required
                .build();

        User savedUser = userRepository.save(user);
        return savedUser;
    }

    public AuthResponse loginUser(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()));

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getLockTime() != null) {
                if (Instant.now().isBefore(user.getLockTime().plusSeconds(LOCK_TIME_DURATION_SEC))) {
                    throw new CustomException("Account is locked. Try again later.", HttpStatus.LOCKED);
                } else {
                    // Unlock
                    user.setLockTime(null);
                    user.setFailedAttempts(0);
                    userRepository.save(user);
                }
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(request.getUsername());

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();

            // Reset failed attempts on success
            user.setFailedAttempts(0);
            user.setLockTime(null);
            userRepository.save(user);

            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            return AuthResponse.builder()
                    .accessToken(jwt)
                    .refreshToken(refreshToken)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .roles(roles)
                    .build();

        } catch (BadCredentialsException ex) {
            if (userOpt.isPresent()) {
                increaseFailedAttempts(userOpt.get());
            }
            throw ex;
        }
    }

    private void increaseFailedAttempts(User user) {
        int newFailedAttempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(newFailedAttempts);

        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockTime(Instant.now());
            userRepository.save(user);
            throw new CustomException("Account locked due to 5 consecutive failed login attempts.", HttpStatus.LOCKED);
        } else {
            userRepository.save(user);
        }
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new CustomException("Invalid verification token", HttpStatus.BAD_REQUEST));

        user.setVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    public void verifyOtp(OtpVerificationRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found with email " + request.getEmail(), HttpStatus.NOT_FOUND));

        if (user.getOtp() == null || !user.getOtp().equals(request.getOtp())) {
            throw new CustomException("Invalid OTP code", HttpStatus.BAD_REQUEST);
        }

        if (user.getOtpExpiry() == null || Instant.now().isAfter(user.getOtpExpiry())) {
            throw new CustomException("OTP code has expired", HttpStatus.BAD_REQUEST);
        }

        user.setVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    public void initiateForgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found with email " + request.getEmail(), HttpStatus.NOT_FOUND));

        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        userRepository.save(user);

        System.out.println("====== FORGOT PASSWORD EMAIL SIMULATION ======");
        System.out.println("To: " + user.getEmail());
        System.out.println("Reset Password Token: " + token);
        System.out.println("===============================================");
    }

    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByVerificationToken(request.getToken())
                .orElseThrow(() -> new CustomException("Invalid or expired password reset token", HttpStatus.BAD_REQUEST));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setVerificationToken(null);
        user.setFailedAttempts(0);
        user.setLockTime(null);
        userRepository.save(user);
    }

    public AuthResponse refreshAccessToken(String refreshToken) {
        if (tokenProvider.validateToken(refreshToken)) {
            String username = tokenProvider.getUsernameFromJWT(refreshToken);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new CustomException("User not found from refresh token", HttpStatus.BAD_REQUEST));

            // Generate fresh access token using the stored user
            String newAccessToken = tokenProvider.generateTokenFromUsername(username, user.getId(), user.getRoles());
            String newRefreshToken = tokenProvider.generateRefreshToken(username);

            List<String> roles = user.getRoles().stream()
                    .map(Role::name)
                    .collect(Collectors.toList());

            return AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .roles(roles)
                    .build();
        }
        throw new CustomException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED);
    }
}
