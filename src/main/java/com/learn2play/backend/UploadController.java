package com.learn2play.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.List;
import java.util.Locale;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
public class UploadController {

    // 20 MB (your UI says 100 MB; you can change this to 100 if you want)
    private static final long MAX_FILE_SIZE_BYTES = 20L * 1024L * 1024L;

    private final QuizGenerator quizGenerator;

    public UploadController(QuizGenerator quizGenerator) {
        this.quizGenerator = quizGenerator;
    }

    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponse(null, null, "File is empty"));
            }

            String originalName = file.getOriginalFilename();
            if (originalName == null || !originalName.contains(".")) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponse(null, null, "File must have an extension"));
            }

            String ext = originalName.substring(originalName.lastIndexOf('.') + 1)
                    .toLowerCase(Locale.ROOT);

            if (!isAllowedExtension(ext)) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponse(null, originalName,
                                "Only .pdf, .docx, .txt and .md files are allowed"));
            }

            if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponse(null, originalName,
                                "File is too large. Maximum size is 20 MB"));
            }

            // 1️⃣ Save file to /uploads
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            Path filePath = uploadDir.resolve(originalName);
            Files.write(filePath, file.getBytes());

            String fileId = "mock-" + System.currentTimeMillis();
            System.out.println("📂 Saved file: " + originalName +
                    " (" + file.getSize() + " bytes) => " + filePath.toAbsolutePath() +
                    " | fileId=" + fileId);

            // 2️⃣ Generate quiz ONLY for PDFs (Python expects PDF)
            if (ext.equals("pdf")) {
                String relativePath = "uploads/" + originalName;
                quizGenerator.generateQuizForFile(relativePath);
            } else {
                System.out.println("[quizgen] Skipping quiz generation (not a PDF): " + originalName);
            }

            // 3️⃣ Respond back to Angular
            UploadResponse response = new UploadResponse(
                    fileId,
                    originalName,
                    "File uploaded" + (ext.equals("pdf") ? " & quiz generated successfully" : " (no quiz for non-PDF)")
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(new UploadResponse(null, null, "Error uploading file or generating quiz"));
        }
    }

    // 🔹 Endpoint Angular calls: GET http://localhost:8080/quiz
    @GetMapping("/quiz")
    public ResponseEntity<List<QuizItem>> getLatestQuiz() {
        List<QuizItem> questions = quizGenerator.getLastQuiz();
        if (questions == null || questions.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(questions);
    }

    private boolean isAllowedExtension(String ext) {
        return ext.equals("pdf") ||
               ext.equals("docx") ||
               ext.equals("txt") ||
               ext.equals("md");
    }
}
