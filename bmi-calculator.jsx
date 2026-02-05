import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Vercel v0 / shadcn/ui friendly single-file component
// Metrics:
// BMI = weight_kg / (height_m^2)
// BRI (Thomas et al., 2013) using waist-to-height ratio r = WC / H:
// eccentricity = sqrt(1 - (r / π)^2)
// BRI = 364.2 - 365.5 * eccentricity

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round(n: number, digits = 1) {
  const p = Math.pow(10, digits);
  return Math.round(n * p) / p;
}

function bmiCategory(bmi: number) {
  if (!Number.isFinite(bmi)) return { label: "–", tone: "secondary" as const, hint: "" };
  if (bmi < 18.5) return { label: "Alipaino", tone: "secondary" as const, hint: "BMI < 18.5" };
  if (bmi < 25) return { label: "Normaali", tone: "default" as const, hint: "18.5–24.9" };
  if (bmi < 30) return { label: "Ylipaino", tone: "warning" as const, hint: "25.0–29.9" };
  return { label: "Lihavuus", tone: "destructive" as const, hint: "≥ 30" };
}

function briCategory(bri: number) {
  if (!Number.isFinite(bri)) return { label: "–", tone: "secondary" as const, hint: "" };
  // BRI is a continuous index; these buckets are practical heuristics based on published typical ranges.
  if (bri < 3) return { label: "Hyvin hoikka keskivartalo", tone: "default" as const, hint: "BRI < 3" };
  if (bri < 5) return { label: "Keskitaso", tone: "default" as const, hint: "3–4.9" };
  if (bri < 6.9) return { label: "Koholla", tone: "warning" as const, hint: "5.0–6.8" };
  if (bri < 12) return { label: "Korkea", tone: "destructive" as const, hint: "≥ 6.9" };
  return { label: "Erittäin korkea", tone: "destructive" as const, hint: "> 12" };
}

// Small helper to emulate a warning variant if your shadcn setup does not include it.
// If your project already has a "warning" badge variant, you can remove this mapping.
function badgeVariant(v: "default" | "secondary" | "destructive" | "warning") {
  if (v === "warning") return "secondary" as const;
  return v;
}

export default function BMIBRICalculator() {
  const [weightKg, setWeightKg] = useState<number>(75);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [waistCm, setWaistCm] = useState<number>(85);

  const heightM = useMemo(() => heightCm / 100, [heightCm]);

  const bmi = useMemo(() => {
    if (heightM <= 0) return NaN;
    return weightKg / (heightM * heightM);
  }, [weightKg, heightM]);

  const bri = useMemo(() => {
    if (heightCm <= 0) return NaN;
    const r = waistCm / heightCm; // waist-to-height ratio (dimensionless)
    const x = r / Math.PI;
    // Guard against impossible geometry or bad inputs
    const inside = clamp(1 - x * x, 0, 1);
    const eccentricity = Math.sqrt(inside);
    return 364.2 - 365.5 * eccentricity;
  }, [waistCm, heightCm]);

  const bmiCat = useMemo(() => bmiCategory(bmi), [bmi]);
  const briCat = useMemo(() => briCategory(bri), [bri]);

  // Simple 0–1 gauges for a quick visual. Not a medical scale.
  const bmiGauge = useMemo(() => clamp((bmi - 15) / (40 - 15), 0, 1), [bmi]);
  const briGauge = useMemo(() => clamp((bri - 1) / (12 - 1), 0, 1), [bri]);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">BMI + BRI ‑laskuri</CardTitle>
          <CardDescription>
            Syötä paino, pituus ja vyötärönympärys. Saat sekä BMI‑ että BRI‑arvion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Weight */}
            <div className="space-y-3">
              <Label htmlFor="weight">Paino (kg)</Label>
              <Input
                id="weight"
                inputMode="decimal"
                type="number"
                min={40}
                max={200}
                step={0.1}
                value={weightKg}
                onChange={(e) => setWeightKg(clamp(Number(e.target.value || 0), 40, 200))}
              />
              <Slider
                value={[weightKg]}
                min={40}
                max={200}
                step={0.1}
                onValueChange={(v) => setWeightKg(v[0])}
                aria-label="Paino"
              />
              <div className="text-xs text-muted-foreground">40–200 kg</div>
            </div>

            {/* Height */}
            <div className="space-y-3">
              <Label htmlFor="height">Pituus (cm)</Label>
              <Input
                id="height"
                inputMode="decimal"
                type="number"
                min={140}
                max={220}
                step={0.1}
                value={heightCm}
                onChange={(e) => setHeightCm(clamp(Number(e.target.value || 0), 140, 220))}
              />
              <Slider
                value={[heightCm]}
                min={140}
                max={220}
                step={0.1}
                onValueChange={(v) => setHeightCm(v[0])}
                aria-label="Pituus"
              />
              <div className="text-xs text-muted-foreground">140–220 cm</div>
            </div>

            {/* Waist */}
            <div className="space-y-3">
              <Label htmlFor="waist">Vyötärö (cm)</Label>
              <Input
                id="waist"
                inputMode="decimal"
                type="number"
                min={50}
                max={150}
                step={0.1}
                value={waistCm}
                onChange={(e) => setWaistCm(clamp(Number(e.target.value || 0), 50, 150))}
              />
              <Slider
                value={[waistCm]}
                min={50}
                max={150}
                step={0.1}
                onValueChange={(v) => setWaistCm(v[0])}
                aria-label="Vyötärö"
              />
              <div className="text-xs text-muted-foreground">50–150 cm</div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            {/* BMI */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">BMI</CardTitle>
                    <CardDescription>Paino suhteessa pituuteen</CardDescription>
                  </div>
                  <Badge variant={badgeVariant(bmiCat.tone)} className="whitespace-nowrap">
                    {bmiCat.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-semibold tabular-nums">{Number.isFinite(bmi) ? round(bmi, 1) : "–"}</div>
                  <div className="text-sm text-muted-foreground">{bmiCat.hint}</div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-full origin-left scale-x-[var(--g)] bg-foreground/70" style={{ "--g": bmiGauge } as React.CSSProperties} />
                </div>
                <div className="text-xs text-muted-foreground">
                  Väritys: vihreä 18.5–24.9 (normaali), keltainen 25.0–29.9 (ylipaino), punainen ≥ 30 (lihavuus).
                </div>
              </CardContent>
            </Card>

            {/* BRI */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">BRI</CardTitle>
                    <CardDescription>Keskivartalon "pyöreys" (vyötärö + pituus)</CardDescription>
                  </div>
                  <Badge variant={badgeVariant(briCat.tone)} className="whitespace-nowrap">
                    {briCat.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-semibold tabular-nums">{Number.isFinite(bri) ? round(bri, 2) : "–"}</div>
                  <div className="text-sm text-muted-foreground">{briCat.hint}</div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-full origin-left scale-x-[var(--g)] bg-foreground/70" style={{ "--g": briGauge } as React.CSSProperties} />
                </div>
                <div className="text-xs text-muted-foreground">
                  BRI on jatkuva indeksi (yleensä noin 1–10). Mitä suurempi, sitä pyöreämpi keskivartalo.
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground leading-relaxed">
            <div className="font-medium text-foreground">Kaavat</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium text-foreground">BMI</span> = paino / (pituus_m)²
              </li>
              <li>
                <span className="font-medium text-foreground">BRI</span> = 364.2 − 365.5 × √(1 − ( (vyötärö/pituus) / π )² )
              </li>
            </ul>
            <div className="mt-3">
              Huom: Nämä ovat väestötason mittareita eivätkä korvaa terveydenhuollon arviota.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional: tiny footer */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        Rakennettu Vercel v0 + shadcn/ui ‑komponenteilla.
      </div>
    </div>
  );
}
