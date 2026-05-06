/**
 * Tide-type scoring.
 *
 * Each of the five games persists a small result object to `localStorage`.
 * `calculateType` consumes those, normalizes the per-axis signals, and scores
 * the player against five archetypal "types" (tide / mountain / mirror /
 * stream / firefly). The archetype with the highest score is returned, along
 * with the full score table.
 *
 * Each per-type score is the average of its criteria, scaled to 0-100, so all
 * types share the same ceiling regardless of how many criteria contribute.
 */

export interface GameData {
  drift: { meanDistance: number; distanceVariance: number };
  periphery: { count: number; accuracy: number };
  pulse: { tapCount: number; meanInterval: number; intervalVariance: number };
  glimpse: { whole: number; detail: number; mood: number; structure: number };
  current: {
    totalDwell: number;
    switches: number;
    longestDwell: number;
    preferredType: string;
  };
}

export type TideType = "tide" | "mountain" | "mirror" | "stream" | "firefly";

export interface ScoreResult {
  type: TideType;
  scores: Record<TideType, number>;
}

const RANGES = {
  driftMean: [0, 300] as const,
  driftVariance: [0, 50000] as const,
  pulseInterval: [200, 2000] as const,
  pulseVariance: [0, 200000] as const,
  peripheryAccuracy: [0, 1] as const,
  currentSwitches: [0, 30] as const,
  currentLongestDwell: [0, 40000] as const,
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function normalize(value: number, range: readonly [number, number]): number {
  const [min, max] = range;
  if (max === min) return 0;
  return clamp01((value - min) / (max - min));
}

const high = (v: number): number => v;
const low = (v: number): number => 1 - v;

/**
 * Triangular peak: returns 1 at `target`, falling linearly to 0 over
 * `halfWidth` on each side. Use for "medium" / "medium-high" criteria.
 */
function near(v: number, target: number, halfWidth = 0.4): number {
  return Math.max(0, 1 - Math.abs(v - target) / halfWidth);
}

export function calculateType(data: GameData): ScoreResult {
  const dMean = normalize(data.drift.meanDistance, RANGES.driftMean);
  const dVar = normalize(data.drift.distanceVariance, RANGES.driftVariance);
  const pVar = normalize(data.pulse.intervalVariance, RANGES.pulseVariance);
  const pAcc = normalize(data.periphery.accuracy, RANGES.peripheryAccuracy);
  const cSwitches = normalize(data.current.switches, RANGES.currentSwitches);
  const cLongest = normalize(
    data.current.longestDwell,
    RANGES.currentLongestDwell,
  );

  const gTotal =
    data.glimpse.whole +
    data.glimpse.detail +
    data.glimpse.mood +
    data.glimpse.structure;
  const gShare = (n: number) => (gTotal > 0 ? n / gTotal : 0);
  const gWhole = gShare(data.glimpse.whole);
  const gDetail = gShare(data.glimpse.detail);
  const gMood = gShare(data.glimpse.mood);
  const gStructure = gShare(data.glimpse.structure);

  // tide: medium-high drift variance + low pulse variance + medium switches + high mood
  const tideRaw =
    near(dVar, 0.7) +
    low(pVar) +
    near(cSwitches, 0.5) +
    high(gMood);

  // mountain: low drift variance + low pulse variance + few switches +
  //           long longestDwell + high detail/structure
  const mountainRaw =
    low(dVar) +
    low(pVar) +
    low(cSwitches) +
    high(cLongest) +
    high((gDetail + gStructure) / 2);

  // mirror: medium drift mean + many switches with medium dwell (even spread)
  //         + high whole + high accuracy
  const mirrorRaw =
    near(dMean, 0.5) +
    high(cSwitches) +
    near(cLongest, 0.4) +
    high(gWhole) +
    high(pAcc);

  // stream: many switches + medium dwell + high structure + medium pulse variance
  const streamRaw =
    high(cSwitches) +
    near(cLongest, 0.5) +
    high(gStructure) +
    near(pVar, 0.5);

  // firefly: high drift variance + high pulse variance + many switches +
  //          high detail + high accuracy
  const fireflyRaw =
    high(dVar) +
    high(pVar) +
    high(cSwitches) +
    high(gDetail) +
    high(pAcc);

  const scores: Record<TideType, number> = {
    tide: Math.round((tideRaw / 4) * 100),
    mountain: Math.round((mountainRaw / 5) * 100),
    mirror: Math.round((mirrorRaw / 5) * 100),
    stream: Math.round((streamRaw / 4) * 100),
    firefly: Math.round((fireflyRaw / 5) * 100),
  };

  let best: TideType = "tide";
  let bestScore = -Infinity;
  for (const t of Object.keys(scores) as TideType[]) {
    if (scores[t] > bestScore) {
      bestScore = scores[t];
      best = t;
    }
  }
  return { type: best, scores };
}

/* ------------------------------------------------------------------ *
 * Verification: five extreme inputs designed to trigger each type.
 * Run with: npx tsx src/lib/scoring.ts
 * ------------------------------------------------------------------ */

export function runScoringTests(): void {
  const cases: Array<{ expected: TideType; data: GameData }> = [
    {
      expected: "tide",
      data: {
        drift: { meanDistance: 100, distanceVariance: 35000 },
        periphery: { count: 4, accuracy: 2 },
        pulse: { tapCount: 30, meanInterval: 1000, intervalVariance: 5000 },
        glimpse: { whole: 0, detail: 0, mood: 3, structure: 0 },
        current: {
          totalDwell: 20000,
          switches: 15,
          longestDwell: 8000,
          preferredType: "color",
        },
      },
    },
    {
      expected: "mountain",
      data: {
        drift: { meanDistance: 30, distanceVariance: 1000 },
        periphery: { count: 4, accuracy: 2 },
        pulse: { tapCount: 30, meanInterval: 1100, intervalVariance: 5000 },
        glimpse: { whole: 0, detail: 2, mood: 0, structure: 1 },
        current: {
          totalDwell: 38000,
          switches: 2,
          longestDwell: 30000,
          preferredType: "shape",
        },
      },
    },
    {
      expected: "mirror",
      data: {
        drift: { meanDistance: 150, distanceVariance: 25000 },
        periphery: { count: 4, accuracy: 4 },
        pulse: { tapCount: 30, meanInterval: 1100, intervalVariance: 50000 },
        glimpse: { whole: 3, detail: 0, mood: 0, structure: 0 },
        current: {
          totalDwell: 20000,
          switches: 25,
          longestDwell: 16000,
          preferredType: "circle",
        },
      },
    },
    {
      expected: "stream",
      data: {
        drift: { meanDistance: 100, distanceVariance: 25000 },
        periphery: { count: 4, accuracy: 2 },
        pulse: { tapCount: 30, meanInterval: 1100, intervalVariance: 100000 },
        glimpse: { whole: 0, detail: 0, mood: 0, structure: 3 },
        current: {
          totalDwell: 30000,
          switches: 25,
          longestDwell: 18000,
          preferredType: "line",
        },
      },
    },
    {
      expected: "firefly",
      data: {
        drift: { meanDistance: 200, distanceVariance: 45000 },
        periphery: { count: 4, accuracy: 4 },
        pulse: { tapCount: 50, meanInterval: 600, intervalVariance: 180000 },
        glimpse: { whole: 0, detail: 3, mood: 0, structure: 0 },
        current: {
          totalDwell: 25000,
          switches: 28,
          longestDwell: 4000,
          preferredType: "symbol",
        },
      },
    },
  ];

  for (const c of cases) {
    const r = calculateType(c.data);
    const ok = r.type === c.expected ? "PASS" : "FAIL";
    console.log(
      `[${ok}] expected=${c.expected.padEnd(8)} got=${r.type.padEnd(8)} scores=`,
      r.scores,
    );
  }
}

// Only execute when this file is run directly (e.g. `npx tsx src/lib/scoring.ts`),
// not when imported by Next.js or other consumers.
if (typeof require !== "undefined" && require.main === module) {
  runScoringTests();
}
