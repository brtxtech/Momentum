import { Injectable } from '@angular/core';

export interface AppUser {
    sub: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly tokenKey = 'moments-studio-jwt';
    private readonly maxSessionMs = 1000 * 60 * 60 * 12;

    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem(this.tokenKey);
    }

    private decodePayload(rawToken: string): AppUser | null {
        try {
            const payload = rawToken.split('.')[1];
            if (!payload) return null;

            const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
            const binary = atob(normalized);
            const json = decodeURIComponent(
                Array.from(binary).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
            );

            return JSON.parse(json) as AppUser;
        } catch {
            return null;
        }
    }

    private buildJwt(payload: AppUser): string {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify(payload));
        return `${header}.${body}.local-signature`;
    }

    get isAuthenticated(): boolean {
        const current = this.getToken();
        if (!current) return false;

        const payload = this.decodePayload(current);
        if (!payload) {
            this.logout();
            return false;
        }

        if (payload.exp * 1000 <= Date.now()) {
            this.logout();
            return false;
        }

        return true;
    }

    get user(): AppUser | null {
        const token = this.getToken();
        if (!token) return null;
        return this.decodePayload(token);
    }

    getToken(): string | null {
        if (this.token) return this.token;

        const saved = localStorage.getItem(this.tokenKey);
        if (!saved) return null;

        this.token = saved;
        return saved;
    }

    async login(email: string, password: string): Promise<AppUser> {
        const cleanEmail = email.trim();

        if (!cleanEmail || !cleanEmail.includes('@')) {
            throw new Error('Use a valid email address.');
        }

        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters.');
        }

        const now = Date.now();
        const payload: AppUser = {
            sub: crypto.randomUUID(),
            email: cleanEmail,
            role: 'user',
            iat: Math.floor(now / 1000),
            exp: Math.floor((now + this.maxSessionMs) / 1000)
        };

        const jwt = this.buildJwt(payload);
        localStorage.setItem(this.tokenKey, jwt);
        this.token = jwt;

        return payload;
    }

    logout(): void {
        this.token = null;
        localStorage.removeItem(this.tokenKey);
    }

    get displayName(): string {
        const user = this.user;
        if (!user) return 'Guest';
        return user.email.split('@')[0] || 'User';
    }
}
