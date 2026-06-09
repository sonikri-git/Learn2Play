import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-results',
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {
score = 0;
totalQuestions = 0;

constructor(
  private router: Router
) {

  const state = history.state;

  this.score =
    state.correctAnswers || 0;

  this.totalQuestions =
    state.totalQuestions || 0;
}
  
  get percentage(): number {
    return Math.round(
      (this.score / this.totalQuestions) * 100
    );
  }

  reviewAnswers() {
    this.router.navigate(['/review']);
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}