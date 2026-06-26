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
  saveNotificationSettings,
  saveOrganizationSettings,
  saveProfileSettings,
  completeOnboarding as completeOnboardingFn,
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
  error: string | null;
  refreshSettings: () => Promise<void>;
  saveProfile: (values: ProfileSettingsValues) => Promise<UserSettings>;
  saveOrganization: (values: OrganizationSettingsValues) => Promise<UserSettings>;
  saveNotifications: (values: NotificationSettingsValues) => Promise<UserSettings>;
  completeOnboarding: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchUserSettings();
      setSettings(data);
      settingsRef.current = data;
    } catch (err) {
      setSettings(DEFAULT_USER_SETTINGS);
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const saveProfile = useCallback(async (values: ProfileSettingsValues) => {
    setIsSaving(true);
    setError(null);

    try {
      const saved = await saveProfileSettings({
        ...values,
        userId: settingsRef.current.userId,
      });
      setSettings(saved);
      settingsRef.current = saved;
      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveOrganization = useCallback(async (values: OrganizationSettingsValues) => {
    setIsSaving(true);
    setError(null);

    const organizationId = settingsRef.current.organizationId;
    if (!organizationId) {
      const message = "Organization not found.";
      setError(message);
      throw new Error(message);
    }

    try {
      const saved = await saveOrganizationSettings(organizationId, values);
      setSettings(saved);
      settingsRef.current = saved;
      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save organization.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveNotifications = useCallback(async (values: NotificationSettingsValues) => {
    setIsSaving(true);
    setError(null);

    const userId = settingsRef.current.userId;
    if (!userId) {
      const message = "User not found.";
      setError(message);
      throw new Error(message);
    }

    try {
      const saved = await saveNotificationSettings(userId, values);
      setSettings(saved);
      settingsRef.current = saved;
      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save notifications.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    const userId = settingsRef.current.userId;
    if (!userId) return;
    await completeOnboardingFn(userId);
    setSettings((prev) => ({ ...prev, onboardingCompleted: true }));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      isSaving,
      error,
      refreshSettings,
      saveProfile,
      saveOrganization,
      saveNotifications,
      completeOnboarding,
    }),
    [
      settings,
      isLoading,
      isSaving,
      error,
      refreshSettings,
      saveProfile,
      saveOrganization,
      saveNotifications,
      completeOnboarding,
    ]
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }
  return context;
}
