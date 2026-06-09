import { Routes } from '@angular/router';
import { canActivateAuth } from './core/auth/auth.guard';
import { QuizComponent } from './quiz/quiz.component';
import { ResultsComponent } from './results/results.component';

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
  },{
  path: 'results',
  loadComponent: () =>
    import('./results/results.component')
      .then(m => m.ResultsComponent)
},

  {
    path: '**',
    redirectTo: 'login'
  }

];