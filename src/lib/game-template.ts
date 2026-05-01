/**
 * Shared template for Tide's micro-games.
 *
 * Each game has the same three-phase lifecycle (setup → play → end) and the
 * same persistence shape (`localStorage["tide_{name}_result"]`), but the per-
 * frame sample and the final aggregated result vary by game. Those vary across
 * games, so they are expressed as generic parameters on `GameTemplate`.
 */

export type GamePhase = "setup" | "play" | "end";

/** State handed to a game's per-frame `sample` function. */
export interface GameSampleContext {
  /** Seconds since the player pressed Start. */
  elapsed: number;
  /** `elapsed / durationSeconds`, in `[0, 1]`. */
  progress: number;
  /** Latest mouse position, or `null` if the user hasn't moved yet. */
  mouse: { x: number; y: number } | null;
  /** `performance.now()` at the time of sampling. */
  now: number;
}

/** Phase 1 — what the player sees before the game starts. */
export interface GameSetup {
  title: string;
  description?: string;
  startLabel?: string;
}

/** Phase 2 — runtime behavior while the timer counts down. */
export interface GamePlay<TSample> {
  durationSeconds: number;
  /**
   * Called once per animation frame between Start and the end of the timer.
   * Return a sample to record, or `null` to skip this frame.
   */
  sample: (ctx: GameSampleContext) => TSample | null;
}

/** Phase 3 — how to reduce samples and where to go next. */
export interface GameEnd<TSample, TResult> {
  /** Reduce the collected samples to the object that gets persisted. */
  computeResult: (samples: TSample[]) => TResult;
  /** Path segment for the next game, e.g. `"periphery"` → `/games/periphery`. */
  next: string;
}

/**
 * Full game definition. `TSample` is the per-frame data (DataSchema for the
 * play phase); `TResult` is the persisted aggregate (DataSchema for storage).
 */
export interface GameTemplate<TSample = unknown, TResult = unknown> {
  /** Used in the storage key `tide_{name}_result`. */
  name: string;
  setup: GameSetup;
  play: GamePlay<TSample>;
  end: GameEnd<TSample, TResult>;
}

export const STORAGE_KEY_PREFIX = "tide_";
export const STORAGE_KEY_SUFFIX = "_result";
export const GAMES_ROUTE_PREFIX = "/games/";

export function storageKey(name: string): string {
  return `${STORAGE_KEY_PREFIX}${name}${STORAGE_KEY_SUFFIX}`;
}

export function nextRoute(next: string): string {
  return `${GAMES_ROUTE_PREFIX}${next}`;
}

/* ------------------------------------------------------------------ *
 * Reference: how Game 1 (The Drift) maps onto this template.
 * Kept here as types so future games have a working example to copy.
 * ------------------------------------------------------------------ */

export interface DriftSample {
  distance: number;
}

export interface DriftResult {
  meanDistance: number;
  distanceVariance: number;
}

export type DriftTemplate = GameTemplate<DriftSample, DriftResult>;

export type PeripheryCorner = "tl" | "tr" | "bl" | "br";
export type PeripheryShape = "★" | "○" | "△" | "◇";

export interface PeripherySample {
  corner: PeripheryCorner;
  shape: PeripheryShape;
}

export interface PeripheryResult {
  flashes: PeripherySample[];
  /** Filled in by the post-game quiz, not the play phase. */
  answers?: { count: number; shapes: string[] };
  /** `0..1`, computed in the quiz from `flashes` vs `answers`. */
  accuracy?: number;
}

export type PeripheryTemplate = GameTemplate<PeripherySample, PeripheryResult>;

/** A tap timestamp in milliseconds (`performance.now()`). */
export type PulseSample = number;

export interface PulseResult {
  tapCount: number;
  /** Mean inter-tap interval in milliseconds. `0` if fewer than two taps. */
  meanInterval: number;
  /** Population variance of inter-tap intervals. `0` if fewer than two taps. */
  intervalVariance: number;
}

export type PulseTemplate = GameTemplate<PulseSample, PulseResult>;
