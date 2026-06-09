// src/app/quiz/quiz.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { QuizService } from '../core/api/quiz.service';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface QuizItem {

  id?: number;

  type: string;
  question: string;

  options?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };

  answer_letter?: string;
  answer_text?: string;
  answer?: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit {

  private quizService = inject(QuizService);
  private router = inject(Router);

  selectedAnswers: { [key: number]: string } = {};

  quiz = signal<QuizItem[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {

    this.quizService.getQuiz().subscribe({

      next: (data: any) => {

        console.log('Quiz data:', data);

        if (Array.isArray(data)) {

          this.quiz.set(data as QuizItem[]);

        } else if (
          data &&
          Array.isArray(data.questions)
        ) {

          this.quiz.set(
            data.questions as QuizItem[]
          );

        } else {

          this.error.set(
            'Quiz format is not valid.'
          );
        }

        this.loading.set(false);
      },

      error: (err) => {

        console.error(
          'Failed to load quiz',
          err
        );

        this.error.set(
          'Failed to load quiz. Please try uploading again.'
        );

        this.loading.set(false);
      }
    });
  }

  goBack() {

    this.router.navigate(['/upload']);
  }
submitQuiz(): void {

  const unanswered: number[] = [];

  this.quiz().forEach((question, index) => {

    if (
      question.options &&
      !this.selectedAnswers[index]
    ) {
      unanswered.push(index + 1);
    }

  });

  if (unanswered.length > 0) {

    alert(
      'Please answer all MCQs first.\n\nMissing: Q' +
      unanswered.join(', Q')
    );

    return;
  }

  let correctAnswers = 0;

  const answers = this.quiz().map(
    (question, index) => {

      const selectedLetter =
        this.selectedAnswers[index];

      if (
        selectedLetter ===
        question.answer_letter
      ) {
        correctAnswers++;
      }

      return {
        questionId: question.id,
        selectedAnswerLetter:
          selectedLetter,
        selectedAnswerText: null
      };
    }
  );

  this.quizService
    .getLatestQuiz()
    .subscribe({

      next: (quizData) => {

        const quizId =
          quizData.quizId;

        const user =
          JSON.parse(
            localStorage.getItem(
              'user'
            ) || '{}'
          );

        const payload = {

          userEmail:
            user.email ||
            'guest@learn2play.local',

          answers
        };

        this.quizService
          .submitAttempt(
            quizId,
            payload
          )
          .subscribe({

            next: (result) => {

              console.log(
                'Attempt Saved',
                result
              );

              this.router.navigate(
                ['/results'],
                {
                  state: {
                    correctAnswers,
                    totalQuestions:
                      this.quiz().length
                  }
                }
              );
            },

            error: (err) => {

              console.error(
                err
              );

              alert(
                'Failed to save quiz result'
              );
            }
          });
      },

      error: (err) => {

        console.error(
          err
        );

        alert(
          'Failed to load latest quiz'
        );
      }
    });
}}