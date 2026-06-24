'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { EstablishmentSettings } from '@/lib/supabase';
import { LS_KEYS, getAll, insert, update, generateId, addAuditLog } from '@/lib/local-db';

interface EstablishmentContextType {
  settings: EstablishmentSettings | null;
  loading: boolean;
  updateSettings: (settings: Partial<EstablishmentSettings>) => Promise<{ error: Error | null }>;
  refreshSettings: () => Promise<void>;
}

const EstablishmentContext = createContext<EstablishmentContextType | undefined>(undefined);

export function EstablishmentProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<EstablishmentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(() => {
    const data = getAll<EstablishmentSettings>(LS_KEYS.SETTINGS);
    if (data.length > 0) {
      setSettings(data[0]);
    } else {
      const defaultSettings = {
        id: generateId(),
        name: 'Bar & Hotel Manager',
        logo_url: null,
        address: null,
        phone: null,
        email: null,
        website: null,
        cnpj: null,
        ie: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      insert(LS_KEYS.SETTINGS, defaultSettings);
      setSettings(defaultSettings as EstablishmentSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<EstablishmentSettings>) => {
    if (!settings) return { error: new Error('Settings not loaded') };

    const updated = update<EstablishmentSettings>(LS_KEYS.SETTINGS, settings.id, newSettings);
    if (!updated) {
      return { error: new Error('Failed to update settings') };
    }

    addAuditLog('update_settings', 'settings', settings.id, null, updated);
    setSettings(updated);
    return { error: null };
  };

  return (
    <EstablishmentContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings: async () => fetchSettings(),
      }}
    >
      {children}
    </EstablishmentContext.Provider>
  );
}

export function useEstablishment() {
  const context = useContext(EstablishmentContext);
  if (context === undefined) {
    throw new Error('useEstablishment must be used within an EstablishmentProvider');
  }
  return context;
}
