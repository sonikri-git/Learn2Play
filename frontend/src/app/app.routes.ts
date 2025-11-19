import { Routes } from '@angular/router';
import { canActivateAuth } from './core/auth/auth.guard';
import { QuizComponent } from './quiz/quiz.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login.page').then(m => m.LoginPage) },
  { path: 'upload', canActivate: [canActivateAuth], loadComponent: () => import('./features/upload.page').then(m => m.UploadPage) },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
   { path: 'quiz', component: QuizComponent },
  { path: '**', redirectTo: 'login' },
];
