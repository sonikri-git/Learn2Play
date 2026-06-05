package com.learn2play.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class QuizAttemptRequest {
    private String userEmail;
    private List<AnswerSubmission> answers = new ArrayList<>();

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public List<AnswerSubmission> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerSubmission> answers) {
        this.answers = answers;
    }
}
