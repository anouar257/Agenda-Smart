import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly THEME_KEY = 'agenda-theme';

    readonly isDarkMode = signal<boolean>(true);

    constructor() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem(this.THEME_KEY);
        if (savedTheme) {
            this.isDarkMode.set(savedTheme === 'dark');
        }

        // Apply theme on change
        effect(() => {
            this.applyTheme(this.isDarkMode());
        });
    }

    toggleTheme(): void {
        this.isDarkMode.update(current => !current);
        localStorage.setItem(this.THEME_KEY, this.isDarkMode() ? 'dark' : 'light');
    }

    private applyTheme(isDark: boolean): void {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
}
