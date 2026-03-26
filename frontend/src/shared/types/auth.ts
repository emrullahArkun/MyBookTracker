export type AuthRole = 'USER' | 'ADMIN' | string;

export type AuthUser = {
    id: number;
    email: string;
    role: AuthRole;
};

export type StoredAuthUser = {
    email: string;
    role?: AuthRole;
    id?: number;
};

export type AuthContextValue = {
    user: StoredAuthUser | null;
    isAuthenticated: boolean;
    login: (userData: StoredAuthUser) => void;
    logout: () => Promise<void>;
    loading: boolean;
    token: string | null;
};

export type AuthResponse = {
    user: AuthUser;
};

export type RegisterResponse = {
    message: string;
    user: AuthUser;
};

export type SessionResponse = {
    user: AuthUser;
};
