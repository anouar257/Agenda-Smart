import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

interface AuthCredentials {
    username: string;
    password: string;
}

interface UserInfo {
    username: string;
    token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // User info signals
    private readonly _userInfo = signal<UserInfo | null>(this.loadUserInfo());

    readonly isAuthenticated = computed(() => !!this._userInfo());
    readonly username = computed(() => this._userInfo()?.username || 'Utilisateur');
    readonly token = computed(() => this._userInfo()?.token || null);

    private loadUserInfo(): UserInfo | null {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        if (token && username) {
            return { token, username };
        }
        return null;
    }

    login(credentials: AuthCredentials) {
        return this.http.post('/api/auth/token', credentials, { responseType: 'text' }).pipe(
            tap(token => {
                // Save both token and username
                localStorage.setItem('token', token);
                localStorage.setItem('username', credentials.username);
                this._userInfo.set({ token, username: credentials.username });
                this.router.navigate(['/']);
            })
        );
    }

    register(credentials: AuthCredentials) {
        return this.http.post('/api/auth/register', credentials, { responseType: 'text' });
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        this._userInfo.set(null);
        this.router.navigate(['/login']);
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getUsername(): string {
        return this._userInfo()?.username || 'Utilisateur';
    }
}
