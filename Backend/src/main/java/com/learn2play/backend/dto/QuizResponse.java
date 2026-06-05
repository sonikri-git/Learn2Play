package com.learn2play.backend.dto;

import com.learn2play.backend.QuizItem;

import java.util.ArrayList;
import java.util.List;

public class QuizResponse {
    private Long quizId;
    private String title;
    private List<QuizItem> questions = new ArrayList<>();

    public QuizResponse() {
    }

    public QuizResponse(Long quizId, String title, List<QuizItem> questions) {
        this.quizId = quizId;
        this.title = title;
        this.questions = questions;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<QuizItem> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuizItem> questions) {
        this.questions = questions;
    }
}
