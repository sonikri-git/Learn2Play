package com.learn2play.backend.repository;

import com.learn2play.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByQuizIdOrderBySortOrderAsc(Long quizId);
}
