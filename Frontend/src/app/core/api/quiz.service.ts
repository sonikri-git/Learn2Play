import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuizService {

  private apiUrl = 'http://localhost:8080';

  constructor(
    private http: HttpClient
  ) {}

  getQuiz(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/quiz`
    );

  }

  getLatestQuiz(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/quiz/latest`
    );

  }

  submitAttempt(
    quizId: number,
    payload: any
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/quiz/${quizId}/attempts`,
      payload
    );

  }
}