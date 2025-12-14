package com.learn2play.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class QuizGenerator {

    private final ObjectMapper objectMapper;
    private List<QuizItem> lastQuiz = new ArrayList<>();

    public QuizGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<QuizItem> generateQuizForFile(String pdfRelativePath) {
        try {
            // 1. Project root
            String projectRoot = System.getProperty("user.dir");
            Path projectRootPath = Paths.get(projectRoot);

            // 2. Virtualenv python path
            Path pythonExe = projectRootPath
                    .resolve("venv-quiz")
                    .resolve("Scripts")
                    .resolve("python.exe");

            // 3. quiz script path
            Path quizgenScript = projectRootPath
                    .resolve("ai")
                    .resolve("quizgen.py");

            // 4. PDF absolute path
            Path pdfPath = projectRootPath.resolve(pdfRelativePath);

            System.out.println("[quizgen] Using Python: " + pythonExe);
            System.out.println("[quizgen] Using script: " + quizgenScript);
            System.out.println("[quizgen] Using PDF: " + pdfPath);

            // 5. Run python command
            ProcessBuilder pb = new ProcessBuilder(
                    pythonExe.toString(),
                    quizgenScript.toString(),
                    pdfPath.toString()
            );

            pb.directory(new File(projectRoot));  // Python runs in project root
            pb.redirectErrorStream(true);

            Process process = pb.start();

            // Log output from Python
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {

                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println("[quizgen] " + line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("quizgen.py failed with exit code " + exitCode);
            }

            // 6. Load generated JSON
            //    Python writes generated_questions.json in the PROJECT ROOT
            Path jsonPath = projectRootPath
                    .resolve("generated_questions.json");

            if (!Files.exists(jsonPath)) {
                throw new RuntimeException("generated_questions.json not found at: " + jsonPath.toAbsolutePath());
            }

            String json = Files.readString(jsonPath);

            QuizItem[] arr = objectMapper.readValue(json, QuizItem[].class);
            lastQuiz = Arrays.asList(arr);

            System.out.println("[quizgen] Loaded " + lastQuiz.size() + " questions");
            return lastQuiz;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate quiz", e);
        }
    }

    public List<QuizItem> getLastQuiz() {
        return lastQuiz;
    }
}
