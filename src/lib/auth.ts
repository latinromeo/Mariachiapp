'use client';

import { createContext, useContext } from 'react';

export type UserRole = 'Administrador General' | 'Director Musical' | 'Coordinador de Eventos' | 'Músico' | 'Contador' | 'Beta Tester';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar: string;
}

export const USERS: Record<string, User> = {
    'admin': { id: 'admin', name: 'Admin General', email: 'admin@mariachireyes.com', role: 'Administrador General', avatar: 'AG' },
    'director': { id: 'director', name: 'Director Musical', email: 'director@mariachireyes.com', role: 'Director Musical', avatar: 'DM' },
    'coordinator': { id: 'coordinator', name: 'Coordinador de Eventos', email: 'coordinador@mariachireyes.com', role: 'Coordinador de Eventos', avatar: 'CE' },
    'musician': { id: 'musician', name: 'Juan Pérez (Músico)', email: 'juan.perez@email.com', role: 'Músico', avatar: 'JP' },
    'accountant': { id: 'accountant', name: 'Contador Jefe', email: 'contador@email.com', role: 'Contador', avatar: 'CJ' },
    'tester': { id: 'tester', name: 'Beta Tester', email: 'tester@mariachireyes.com', role: 'Beta Tester', avatar: 'BT' }
};

export const ROLES_CONFIG: Record<UserRole, { pages: string[], canCreateEvents: boolean, canCreateClients: boolean, canCreateRehearsals: boolean, canCreateSongs: boolean, canManageUsers: boolean, canSeeFinance: boolean }> = {
    'Administrador General': {
        pages: ['/dashboard', '/dashboard/clients', '/dashboard/events', '/dashboard/rehearsals', '/dashboard/repertoire', '/dashboard/media', '/dashboard/finance', '/dashboard/users', '/dashboard/profile'],
        canCreateEvents: true, canCreateClients: true, canCreateRehearsals: true, canCreateSongs: true, canManageUsers: true, canSeeFinance: true
    },
    'Director Musical': {
        pages: ['/dashboard', '/dashboard/events', '/dashboard/rehearsals', '/dashboard/repertoire', '/dashboard/profile'],
        canCreateEvents: false, canCreateClients: false, canCreateRehearsals: true, canCreateSongs: true, canManageUsers: false, canSeeFinance: false
    },
    'Coordinador de Eventos': {
        pages: ['/dashboard', '/dashboard/clients', '/dashboard/events', '/dashboard/rehearsals', '/dashboard/profile'],
        canCreateEvents: true, canCreateClients: true, canCreateRehearsals: false, canCreateSongs: false, canManageUsers: false, canSeeFinance: false
    },
    'Músico': {
        pages: ['/dashboard', '/dashboard/events', '/dashboard/rehearsals', '/dashboard/repertoire', '/dashboard/my-income', '/dashboard/profile'],
        canCreateEvents: false, canCreateClients: false, canCreateRehearsals: false, canCreateSongs: false, canManageUsers: false, canSeeFinance: false
    },
    'Contador': {
        pages: ['/dashboard/media', '/dashboard/profile'],
        canCreateEvents: false, canCreateClients: false, canCreateRehearsals: false, canCreateSongs: false, canManageUsers: false, canSeeFinance: false
    },
    'Beta Tester': {
        pages: ['/dashboard', '/dashboard/clients', '/dashboard/events', '/dashboard/rehearsals', '/dashboard/repertoire', '/dashboard/media', '/dashboard/finance', '/dashboard/profile'],
        canCreateEvents: true, canCreateClients: true, canCreateRehearsals: true, canCreateSongs: true, canManageUsers: false, canSeeFinance: true
    }
};

export interface UserContextType {
    user: User;
    setUser: (user: User) => void;
    permissions: {
        hasAccess: (page: string) => boolean;
        canCreateEvents: boolean;
        canCreateClients: boolean;
        canCreateRehearsals: boolean;
        canCreateSongs: boolean;
        canManageUsers: boolean;
        canSeeFinance: boolean;
    }
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
