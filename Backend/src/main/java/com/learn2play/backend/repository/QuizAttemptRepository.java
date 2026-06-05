package com.learn2play.backend.repository;

import com.learn2play.backend.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByQuizIdOrderByAttemptedAtDesc(Long quizId);
    List<QuizAttempt> findByUserEmailOrderByAttemptedAtDesc(String userEmail);
}
