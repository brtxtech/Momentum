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
      :host {
        --auth-bg: #0e1220;
        --auth-panel: rgba(18, 21, 31, 0.9);
        --auth-text: #ffffff;
        --auth-muted: rgba(255, 255, 255, 0.7);
        --auth-border: rgba(255, 255, 255, 0.08);
        --auth-input-bg: rgba(255, 255, 255, 0.03);
        --auth-input-text: #ffffff;
        --auth-button-gradient: linear-gradient(135deg, #8b5cf6, #7c3aed);
        --auth-button-text: #ffffff;
        --auth-secondary-bg: transparent;
        --auth-secondary-border: rgba(255, 255, 255, 0.12);
        --auth-secondary-text: #ffffff;
        --auth-status-success: #c7f9cc;
        --auth-status-error: #ff9ca6;
        display: block;
      }

      :root[data-theme='light'] {
        --auth-bg: #f4f5f7;
        --auth-panel: #ffffff;
        --auth-text: #111827;
        --auth-muted: #5b6475;
        --auth-border: rgba(17, 24, 39, 0.08);
        --auth-input-bg: rgba(17, 24, 39, 0.02);
        --auth-input-text: #111827;
        --auth-button-gradient: linear-gradient(135deg, #7c3aed, #5b21b6);
        --auth-button-text: #ffffff;
        --auth-secondary-bg: #ffffff;
        --auth-secondary-border: rgba(17, 24, 39, 0.12);
        --auth-secondary-text: #111827;
        --auth-status-success: #0b7a47;
        --auth-status-error: #b42318;
      }

      .auth-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: radial-gradient(circle at top, rgba(130, 112, 240, 0.2), transparent 35%), var(--auth-bg);
        color: var(--auth-text);
      }
      .auth-card {
        width: min(420px, 100%);
        padding: 32px 28px;
        border-radius: 24px;
        background: var(--auth-panel);
        border: 1px solid var(--auth-border);
        box-shadow: 0 22px 55px rgba(0, 0, 0, 0.18);
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
        color: var(--auth-text);
      }
      .muted { color: var(--auth-muted); margin: 0 0 22px; }
      label {
        display: grid;
        gap: 8px;
        margin-bottom: 16px;
        color: var(--auth-text);
      }
      input {
        width: 100%;
        border: 1px solid var(--auth-border);
        background: var(--auth-input-bg);
        color: var(--auth-input-text);
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
        background: var(--auth-button-gradient);
        border: none;
        color: var(--auth-button-text);
      }
      .secondary {
        background: var(--auth-secondary-bg);
        border: 1px solid var(--auth-secondary-border);
        color: var(--auth-secondary-text);
      }
      .status {
        margin-top: 16px;
        min-height: 24px;
        color: var(--auth-status-success);
      }
      .status.error { color: var(--auth-status-error); }
    `
    ]
})
export class LoginComponent {
    email = '';
    password = '';
    busy = signal(false);
    status = signal('');
    error = signal(false);

    constructor(private auth: AuthService, private router: Router) { }

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
