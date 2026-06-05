import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';

import { AuthService } from '../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private sb = inject(MatSnackBar);

  loading = signal(false);
  passwordVisible = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [true]
  });

  isPasswordVisible() {
    return this.passwordVisible();
  }

  togglePassword() {
    this.passwordVisible.update(v => !v);
  }

  onSubmit() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const { email, password } =
      this.form.value;

    this.auth.login({
      email: email!,
      password: password!
    }).subscribe({

      next: (user: any) => {

        localStorage.setItem(
          'user',
          JSON.stringify(user)
        );

        this.loading.set(false);

        this.router.navigateByUrl(
          '/upload'
        );
      },

      error: (err) => {

        this.loading.set(false);

        this.sb.open(
          err?.error || 'Login failed',
          'Close',
          {
            duration: 3000
          }
        );
      }
    });
  }

  goToSignup(event: Event) {

    event.preventDefault();

    this.router.navigateByUrl(
      '/signup'
    );
  }

  forgotPassword(event: Event) {

    event.preventDefault();

    this.sb.open(
      'Forgot password coming soon',
      'Close',
      {
        duration: 3000
      }
    );
  }
}