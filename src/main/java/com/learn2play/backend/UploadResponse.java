package com.learn2play.backend;

public class UploadResponse {

    private String fileId;
    private String fileName;
    private String message;

    public UploadResponse() {
    }

    public UploadResponse(String fileId, String fileName, String message) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.message = message;
    }

    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
