package com.learn2play.backend;

import com.learn2play.backend.entity.AppUser;
import com.learn2play.backend.repository.AppUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final AppUserRepository appUserRepository;

    private final BCryptPasswordEncoder encoder =
            new BCryptPasswordEncoder();

    public AuthController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody AppUser user) {

        if (appUserRepository.findByEmail(
                user.getEmail()).isPresent()) {

            return ResponseEntity.badRequest()
                    .body("Email already exists");
        }

        user.setPassword(
                encoder.encode(user.getPassword())
        );

        appUserRepository.save(user);

        return ResponseEntity.ok(
                "Account created successfully"
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody AppUser loginUser) {

        Optional<AppUser> existingUser =
                appUserRepository.findByEmail(
                        loginUser.getEmail());

        if (existingUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Invalid email");
        }

        AppUser user = existingUser.get();

        if (!encoder.matches(
                loginUser.getPassword(),
                user.getPassword())) {

            return ResponseEntity.badRequest()
                    .body("Invalid password");
        }

        return ResponseEntity.ok(user);
    }
}