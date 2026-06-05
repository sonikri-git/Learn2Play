import { Routes } from '@angular/router';
import { canActivateAuth } from './core/auth/auth.guard';
import { QuizComponent } from './quiz/quiz.component';

export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () =>
      import('./features/login.page')
        .then(m => m.LoginPage)
  },

  {
    path: 'signup',
    loadComponent: () =>
      import('./core/auth/signup/signup.component')
        .then(m => m.SignupComponent)
  },

  {
    path: 'upload',
    canActivate: [canActivateAuth],
    loadComponent: () =>
      import('./features/upload.page')
        .then(m => m.UploadPage)
  },

  {
    path: 'quiz',
    component: QuizComponent
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];