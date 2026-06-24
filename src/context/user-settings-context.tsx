"use client";

import { useEffect, useRef } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fetchUserSettings,
  isSupabaseConfigured,
  saveUserSettings,
} from "@/lib/supabase-client";
import {
  DEFAULT_USER_SETTINGS,
  type NotificationSettingsValues,
  type OrganizationSettingsValues,
  type ProfileSettingsValues,
  type UserSettings,
} from "@/lib/settings-schema";

interface UserSettingsContextValue {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  source: "supabase" | "local";
  refreshSettings: () => Promise<void>;
  saveProfile: (values: ProfileSettingsValues) => Promise<UserSettings>;
  saveOrganization: (values: OrganizationSettingsValues) => Promise<UserSettings>;
  saveNotifications: (values: NotificationSettingsValues) => Promise<UserSettings>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">(
    isSupabaseConfigured() ? "supabase" : "local"
  );
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await fetchUserSettings();
      setSettings(data);
      settingsRef.current = data;
      setSource(isSupabaseConfigured() ? "supabase" : "local");
    } catch {
      setSettings(DEFAULT_USER_SETTINGS);
      settingsRef.current = DEFAULT_USER_SETTINGS;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const persist = useCallback(async (partial: Partial<UserSettings>) => {
    setIsSaving(true);

    try {
      const merged = { ...settingsRef.current, ...partial };
      const saved = await saveUserSettings(merged);
      setSettings(saved);
      settingsRef.current = saved;
      setSource(isSupabaseConfigured() ? "supabase" : "local");
      return saved;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveProfile = useCallback(
    (values: ProfileSettingsValues) => persist(values),
    [persist]
  );

  const saveOrganization = useCallback(
    (values: OrganizationSettingsValues) => persist(values),
    [persist]
  );

  const saveNotifications = useCallback(
    (values: NotificationSettingsValues) => persist(values),
    [persist]
  );

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      isSaving,
      source,
      refreshSettings,
      saveProfile,
      saveOrganization,
      saveNotifications,
    }),
    [
      settings,
      isLoading,
      isSaving,
      source,
      refreshSettings,
      saveProfile,
      saveOrganization,
      saveNotifications,
    ]
  );

  return (
    <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }
  return context;
}
