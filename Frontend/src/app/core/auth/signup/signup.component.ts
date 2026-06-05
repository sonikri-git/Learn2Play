import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';

  register(): void {

    const payload = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.authService.register(payload)
      .subscribe({
        next: () => {

          alert('Account created successfully');

          this.router.navigateByUrl('/login');
        },

        error: (err) => {

          alert(
            err?.error ||
            'Failed to create account'
          );
        }
      });
  }

  goToLogin(event: Event): void {

    event.preventDefault();

    this.router.navigateByUrl('/login');
  }
}