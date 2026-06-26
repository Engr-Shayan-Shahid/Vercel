"use client";

import { SlidersHorizontal } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ScenarioPlannerProps {
  volumeChangePct: number;
  etsPrice: number;
  onVolumeChange: (pct: number) => void;
  onEtsPriceChange: (price: number) => void;
}

const ETS_MIN = 40;
const ETS_MAX = 150;
const VOL_MIN = -50;
const VOL_MAX = 50;

export function ScenarioPlanner({
  volumeChangePct,
  etsPrice,
  onVolumeChange,
  onEtsPriceChange,
}: ScenarioPlannerProps) {
  const volLabel =
    volumeChangePct === 0
      ? "No change"
      : volumeChangePct > 0
        ? `+${volumeChangePct}%`
        : `${volumeChangePct}%`;

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium normal-case tracking-normal text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Scenario Planner
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adjust assumptions to model future CBAM cost scenarios.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volume slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Expected import volume change
            </Label>
            <span
              className={`text-sm font-semibold tabular-nums ${
                volumeChangePct > 0
                  ? "text-amber-400"
                  : volumeChangePct < 0
                    ? "text-emerald-400"
                    : "text-muted-foreground"
              }`}
            >
              {volLabel}
            </span>
          </div>
          <input
            type="range"
            min={VOL_MIN}
            max={VOL_MAX}
            step={5}
            value={volumeChangePct}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="Import volume change percentage"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>−50%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
        </div>

        {/* ETS price slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Expected ETS price
            </Label>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              €{etsPrice}/tCO₂e
            </span>
          </div>
          <input
            type="range"
            min={ETS_MIN}
            max={ETS_MAX}
            step={5}
            value={etsPrice}
            onChange={(e) => onEtsPriceChange(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="ETS price per tonne CO2e"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>€{ETS_MIN}</span>
            <span>€{Math.round((ETS_MIN + ETS_MAX) / 2)}</span>
            <span>€{ETS_MAX}</span>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-black/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Scenarios use your historical average annual import tonnage as a baseline,
            scaled by the volume multiplier across each year's CBAM phase-in rate.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
