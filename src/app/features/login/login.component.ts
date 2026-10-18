import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth-shell">
      <div class="auth-card">
        <p class="eyebrow">Moments Studio</p>
        <h1>Welcome back</h1>
        <p class="muted">Sign in to keep your session and JWT alive while the app is running.</p>

        <label>
          <span>Email</span>
          <input type="email" [(ngModel)]="email" placeholder="you@example.com" />
        </label>

        <label>
          <span>Password</span>
          <input type="password" [(ngModel)]="password" placeholder="••••••••" />
        </label>

        <button type="button" class="primary" (click)="signIn()" [disabled]="busy()">
          {{ busy() ? 'Signing in…' : 'Sign in' }}
        </button>

        <button type="button" class="secondary" routerLink="/feed">
          Continue as guest
        </button>

        <p class="status" role="status" [class.error]="error()">{{ status() }}</p>
      </div>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .auth-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: radial-gradient(circle at top, rgba(130, 112, 240, 0.2), transparent 35%), #0e1220;
      }
      .auth-card {
        width: min(420px, 100%);
        padding: 32px 28px;
        border-radius: 24px;
        background: rgba(18, 21, 31, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 22px 55px rgba(0, 0, 0, 0.28);
      }
      .eyebrow {
        margin: 0 0 12px;
        color: #bca9ff;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        text-transform: uppercase;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 2rem;
      }
      .muted { color: rgba(255,255,255,0.7); margin: 0 0 22px; }
      label {
        display: grid;
        gap: 8px;
        margin-bottom: 16px;
        color: rgba(255,255,255,0.9);
      }
      input {
        width: 100%;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.03);
        color: white;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 1rem;
      }
      button {
        width: 100%;
        border-radius: 12px;
        padding: 12px 16px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
      }
      .primary {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        border: none;
        color: white;
      }
      .secondary {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.12);
        color: white;
      }
      .status {
        margin-top: 16px;
        min-height: 24px;
        color: #c7f9cc;
      }
      .status.error { color: #ff9ca6; }
    `
  ]
})
export class LoginComponent {
  email = '';
  password = '';
  busy = signal(false);
  status = signal('');
  error = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  async signIn() {
    this.busy.set(true);
    this.error.set(false);
    this.status.set('');

    try {
      await this.auth.login(this.email, this.password);
      this.status.set('Signed in successfully.');
      await this.router.navigateByUrl('/feed');
    } catch (error) {
      this.error.set(true);
      this.status.set(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      this.busy.set(false);
    }
  }
}
