"use client";

import { useEffect, useRef, useState } from "react";

import { useUserSettings } from "@/context/user-settings-context";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export function OnboardingGate() {
  const { settings, isLoading } = useUserSettings();
  const [dismissed, setDismissed] = useState(false);

  // Latch: once we decide whether to show the modal (after the first
  // successful settings load), we never re-evaluate. This prevents the
  // modal from remounting mid-flow when refreshSettings() sets isLoading.
  const [show, setShow] = useState<boolean>(false);
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current) return; // Decision already made — don't change it
    if (isLoading) return;       // Wait for first successful load

    decided.current = true;

    const eligible =
      settings.onboardingCompleted === false &&
      (settings.orgType === "importer" || settings.accountType === "importer");

    setShow(eligible);
  }, [isLoading, settings.onboardingCompleted, settings.orgType, settings.accountType]);

  if (!show || dismissed) return null;

  return <OnboardingModal onDismiss={() => setDismissed(true)} />;
}
