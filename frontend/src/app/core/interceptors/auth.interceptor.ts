import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token');

    // Debug: log pour voir les requêtes
    console.log(`[HTTP] ${req.method} ${req.url} - Token: ${token ? 'Present' : 'Missing'}`);

    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('[HTTP] Request with Authorization header');
        return next(cloned);
    }

    return next(req);
};
