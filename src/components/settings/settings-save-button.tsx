import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SettingsSaveButtonProps {
  isSaving: boolean;
  label?: string;
}

export function SettingsSaveButton({
  isSaving,
  label = "Save Changes",
}: SettingsSaveButtonProps) {
  return (
    <Button type="submit" disabled={isSaving} className="min-w-[140px]">
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving…
        </>
      ) : (
        label
      )}
    </Button>
  );
}
