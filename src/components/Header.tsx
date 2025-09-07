import React from 'react';
import type { UserProfile } from '../types';

export const Header: React.FC<{ user: UserProfile | null; onLogin: () => void; onLogout: () => void; isAuthReady: boolean; isAuthLoading: boolean; }> = ({ user, onLogin, onLogout, isAuthReady, isAuthLoading }) => (
    <header className="header" role="banner">
        <div className="header-content">
            <svg className="logo" width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="FinanZen Logo">
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-color)" />
                        <stop offset="100%" stopColor="var(--secondary-color)" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient)" strokeWidth="8"/>
                <path d="M50 75 C 60 65, 65 50, 50 35 C 35 50, 40 65, 50 75 Z" fill="url(#logoGradient)"/>
                <path d="M50 45 C 55 40, 60 30, 50 20 C 40 30, 45 40, 50 45 Z" fill="url(#logoGradient)"/>
            </svg>
            <div className="header-text">
                <h1>Finan<span>Zen</span></h1>
                <p>Seu assessor financeiro pessoal com o poder da Inteligência Artificial.</p>
            </div>
        </div>
        <div className="auth-controls">
            {user ? (
                <div className="user-profile">
                    <img src={user.picture} alt={`Foto de perfil de ${user.name}`} />
                    <span>{user.name}</span>
                    <button onClick={onLogout} className="btn-secondary" disabled={isAuthLoading}>{isAuthLoading ? 'Saindo...' : 'Sair'}</button>
                </div>
            ) : (
                <button onClick={onLogin} className="btn-google" disabled={!isAuthReady || isAuthLoading}>
                    <svg viewBox="0 0 18 18" width="18" height="18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9.18v3.48h4.74c-.2 1.13-.83 2.08-1.78 2.72v2.26h2.9c1.7-1.56 2.67-3.87 2.67-6.62z"></path><path fill="#34A853" d="M9.18 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.35-1.58-5.06-3.71H1.1v2.33C2.5 16.23 5.59 18 9.18 18z"></path><path fill="#FBBC05" d="M4.12 10.71c-.13-.4-.2-.83-.2-1.28s.07-.88.2-1.28V5.82H1.1C.46 7.1.1 8.53.1 10c0 1.47.36 2.9.98 4.18l3.03-2.33z"></path><path fill="#EA4335" d="M9.18 3.54c1.32 0 2.52.45 3.46 1.35l2.58-2.58C13.65.8 11.61 0 9.18 0 5.59 0 2.5 2.23 1.1 5.34l3.02 2.33c.7-2.13 2.7-3.71 5.06-3.71z"></path></svg>
                    <span>{isAuthLoading ? 'Autenticando...' : (isAuthReady ? 'Login com Google' : 'Carregando...')}</span>
                </button>
            )}
        </div>
    </header>
);