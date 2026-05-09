"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as Tone from "tone";

interface SoundscapeDescription {
  aboutTheSound: string;
  recommendedMusic: string;
  howOthersHaveUsedIt: string;
}

interface SoundscapeParams {
  reverbDecay: number;
  filterCutoff: number;
  targetVolume: number;
  fadeInDuration: number;
}

interface SoundscapeResponse {
  description: SoundscapeDescription;
  soundscape: SoundscapeParams;
}

const ATTENTION_TYPES: Record<
  string,
  { chinese: string; english: string }
> = {
  tide: { chinese: "潮", english: "Tide" },
  mountain: { chinese: "山", english: "Mountain" },
  mirror: { chinese: "镜", english: "Mirror" },
  stream: { chinese: "溪", english: "Stream" },
  firefly: { chinese: "萤", english: "Firefly" },
};

const FALLBACK_DESCRIPTION: SoundscapeDescription = {
  aboutTheSound:
    "This soundscape was made for your attention type.",
  recommendedMusic:
    "Music that resonates with this attention type: Brian Eno, Stars of the Lid, Nils Frahm.",
  howOthersHaveUsedIt:
    "How others have used it: Some play it while writing. Others let it run in a quiet morning.",
};

const FALLBACK_PARAMS: SoundscapeParams = {
  reverbDecay: 4,
  filterCutoff: 2000,
  targetVolume: -22,
  fadeInDuration: 3,
};

export default function MeditationPage() {
  const router = useRouter();
  const [type, setType] = useState<string>("tide");
  const [description, setDescription] =
    useState<SoundscapeDescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [imageError, setImageError] = useState(false);

  const playerRef = useRef<Tone.Player | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    const result = localStorage.getItem("tide_result");
    const currentType = result ? JSON.parse(result).type : "tide";
    setType(currentType);

    const gameData = {
      drift: JSON.parse(
        localStorage.getItem("tide_drift_result") || "{}"
      ),
      periphery: JSON.parse(
        localStorage.getItem("tide_periphery_result") || "{}"
      ),
      pulse: JSON.parse(
        localStorage.getItem("tide_pulse_result") || "{}"
      ),
      glimpse: JSON.parse(
        localStorage.getItem("tide_glimpse_result") || "{}"
      ),
      current: JSON.parse(
        localStorage.getItem("tide_current_result") || "{}"
      ),
    };

    const scores = result ? JSON.parse(result).scores : {};

    fetch("/api/soundscape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: currentType, scores, gameData }),
    })
      .then((res) => res.json())
      .then((data: SoundscapeResponse) => {
        setDescription(data.description);
        setIsLoading(false);
        initAudio(currentType, data.soundscape);
      })
      .catch(() => {
        setDescription(FALLBACK_DESCRIPTION);
        setIsLoading(false);
        initAudio(currentType, FALLBACK_PARAMS);
      });

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.stop();
        } catch {
          // ignore — player may not have started
        }
        playerRef.current.dispose();
      }
      if (reverbRef.current) reverbRef.current.dispose();
      if (filterRef.current) filterRef.current.dispose();
    };
  }, []);

  const initAudio = async (
    audioType: string,
    params: SoundscapeParams
  ) => {
    try {
      await Tone.start();

      const reverb = new Tone.Reverb({
        decay: params.reverbDecay,
        wet: 0.5,
      }).toDestination();
      const filter = new Tone.Filter(
        params.filterCutoff,
        "lowpass"
      ).connect(reverb);

      reverbRef.current = reverb;
      filterRef.current = filter;

      const player = new Tone.Player({
        url: `/sounds/${audioType}.mp3`,
        loop: true,
        onload: () => {
          player.volume.value = -60;
          player.connect(filter);
          player.start();
          player.volume.rampTo(
            params.targetVolume,
            params.fadeInDuration
          );
          progressIntervalRef.current = setInterval(() => {
            setProgress((prev) => (prev >= 100 ? 0 : prev + 0.05));
          }, 100);
        },
        onerror: (err) => {
          console.warn(
            `[tide] could not load /sounds/${audioType}.mp3 — page will still display text content.`,
            err
          );
        },
      });

      playerRef.current = player;
    } catch (err) {
      console.warn("[tide] audio init failed:", err);
    }
  };

  const handleLeave = () => {
    if (playerRef.current) {
      try {
        playerRef.current.volume.rampTo(-60, 5);
      } catch {
        // ignore — player may not be initialized
      }
    }
    setTimeout(() => router.push("/about"), 5000);
  };

  const typeInfo = ATTENTION_TYPES[type] || ATTENTION_TYPES.tide;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f1e8",
        color: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "10vh",
        paddingBottom: "120px",
        paddingLeft: "24px",
        paddingRight: "24px",
        position: "relative",
        fontFamily: "var(--font-eb-garamond)",
      }}
    >
      <div
        style={{
          marginBottom: "48px",
          width: "200px",
          height: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imageError ? (
          <div
            style={{
              fontSize: "120px",
              fontFamily: "var(--font-noto-serif-sc)",
              color: "#1a1a1a",
              opacity: 0.85,
              lineHeight: 1,
            }}
          >
            {typeInfo.chinese}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/calligraphy/${type}.png`}
            alt={typeInfo.chinese}
            style={{
              width: "200px",
              height: "200px",
              objectFit: "contain",
            }}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {isLoading ? (
          <p
            style={{
              fontSize: "14px",
              opacity: 0.4,
              fontStyle: "italic",
            }}
          >
            composing...
          </p>
        ) : description ? (
          <>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.9,
                opacity: 0.75,
                fontStyle: "italic",
                marginBottom: "64px",
              }}
            >
              {description.aboutTheSound}
            </p>

            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.9,
                opacity: 0.65,
                marginBottom: "64px",
              }}
            >
              {description.recommendedMusic}
            </p>

            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.9,
                opacity: 0.55,
              }}
            >
              {description.howOthersHaveUsedIt}
            </p>
          </>
        ) : null}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "48px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200px",
          height: "1px",
          background: "rgba(26,26,26,0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "rgba(26,26,26,0.3)",
            transition: "width 0.1s linear",
          }}
        />
      </div>

      <button
        onClick={handleLeave}
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          color: "#1a1a1a",
          opacity: 0.3,
          fontFamily: "inherit",
          padding: "8px",
        }}
        aria-label="Continue"
      >
        →
      </button>
    </div>
  );
}
