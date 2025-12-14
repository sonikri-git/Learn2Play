package com.learn2play.backend;

public class QuizItem {

    private String type;
    private String question;

    public QuizItem() {
    }

    public QuizItem(String type, String question) {
        this.type = type;
        this.question = question;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}
