// src/app/quiz/quiz.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { QuizService } from '../core/api/quiz.service';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
// Angular Material (for matching upload page look)
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
interface QuizItem {
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
  // quiz is an array now (top-level JSON array)
  quiz = signal<QuizItem[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);


  ngOnInit(): void {
    this.quizService.getQuiz().subscribe({
      next: (data: any) => {
        console.log('Quiz data:', data);
        

        // backend returns an array, so just set it directly
        if (Array.isArray(data)) {
          this.quiz.set(data as QuizItem[]);
        } else if (data && Array.isArray(data.questions)) {
          // fallback if later shape changes to { questions: [...] }
          this.quiz.set(data.questions as QuizItem[]);
        } else {
          this.error.set('Quiz format is not valid.');
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load quiz', err);
        this.error.set('Failed to load quiz. Please try uploading again.');
        this.loading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/upload']);
  }
submitQuiz(): void {
  console.log(this.selectedAnswers);

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

  alert('Quiz submitted successfully!');
}
}
