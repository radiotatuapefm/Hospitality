'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LocalUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSession,
  setSession,
  clearSession,
  generateId,
  LS_KEYS,
  getAll,
  initDatabase,
  addAuditLog,
} from '@/lib/local-db';
import { UserRole } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: { id: string; email: string; name: string } | null;
  profile: UserProfile | null;
  session: { token: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (roles: UserRole[]) => boolean;
  isOwner: (userId: string) => boolean;
  // Admin methods
  getAllUsers: () => UserProfile[];
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  deleteUser: (id: string) => Promise<{ error: Error | null }>;
  changePassword: (userId: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/register'];

function localUserToProfile(user: LocalUser): UserProfile {
  return {
    id: user.id,
    user_id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    active: user.active,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSessionState] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initDatabase();
    const currentSession = getSession();
    if (currentSession) {
      setUser(currentSession.user);
      const u = getUserById(currentSession.user.id);
      if (u) {
        setProfile(localUserToProfile(u));
      }
      setSessionState({ token: currentSession.token });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && !PUBLIC_ROUTES.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const signIn = async (email: string, password: string) => {
    try {
      const found = getUserByEmail(email);
      if (!found || found.password !== password) {
        return { error: new Error('Email ou senha incorretos') };
      }
      if (!found.active) {
        return { error: new Error('Usuário inativo') };
      }

      const token = generateId();
      const session = {
        user: {
          id: found.id,
          email: found.email,
          name: found.name,
          role: found.role,
        },
        token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      setSession(session);
      setSessionState({ token });
      setUser({ id: found.id, email: found.email, name: found.name });
      setProfile(localUserToProfile(found));
      addAuditLog('login', 'users', found.id, null, null);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'caixa') => {
    try {
      const existing = getUserByEmail(email);
      if (existing) {
        return { error: new Error('Email já cadastrado') };
      }

      const newUser = createUser({
        email,
        password,
        name,
        role,
        active: true,
        avatar_url: null,
      });

      addAuditLog('register', 'users', newUser.id, null, newUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (user) addAuditLog('logout', 'users', user.id, null, null);
    clearSession();
    setSessionState(null);
    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  const hasPermission = (roles: UserRole[]) => {
    if (!profile) return false;
    return roles.includes(profile.role);
  };

  const isOwner = (userId: string) => {
    return user?.id === userId;
  };

  const getAllUsersList = () => {
    const users = getAllUsers();
    return users.map(localUserToProfile);
  };

  const updateUserProfile = async (id: string, updates: Partial<UserProfile>) => {
    try {
      const localUpdates: Partial<LocalUser> = {
        name: updates.name,
        email: updates.email,
        role: updates.role,
        active: updates.active,
      };
      const updated = updateUser(id, localUpdates);
      if (!updated) return { error: new Error('User not found') };
      addAuditLog('update_user', 'users', id, null, updated);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteUserAccount = async (id: string) => {
    try {
      const removed = deleteUser(id);
      if (!removed) return { error: new Error('User not found') };
      addAuditLog('delete_user', 'users', id, null, null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const changePassword = async (userId: string, newPassword: string) => {
    try {
      const updated = updateUser(userId, { password: newPassword });
      if (!updated) return { error: new Error('User not found') };
      addAuditLog('change_password', 'users', userId, null, null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        hasPermission,
        isOwner,
        getAllUsers: getAllUsersList,
        updateUser: updateUserProfile,
        deleteUser: deleteUserAccount,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
