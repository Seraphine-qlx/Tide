import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { type, gameData } = await request.json();

    const typeNames: Record<string, string> = {
      tide: "Tide (潮)",
      mountain: "Mountain (山)",
      mirror: "Mirror (镜)",
      stream: "Stream (溪)",
      firefly: "Firefly (萤)",
    };

    const humanReadableData = `
      Drift: mean distance ${gameData.drift?.meanDistance?.toFixed(0)}px, variance ${gameData.drift?.distanceVariance?.toFixed(0)}
      Periphery: detected ${gameData.periphery?.count} symbols, accuracy ${gameData.periphery?.accuracy?.toFixed(2)}
      Pulse: ${gameData.pulse?.tapCount} taps, mean interval ${gameData.pulse?.meanInterval?.toFixed(0)}ms, variance ${gameData.pulse?.intervalVariance?.toFixed(0)}
      Glimpse: whole ${gameData.glimpse?.whole}, detail ${gameData.glimpse?.detail}, mood ${gameData.glimpse?.mood}, structure ${gameData.glimpse?.structure}
      Current: ${gameData.current?.switches} switches, longest dwell ${(gameData.current?.longestDwell / 1000)?.toFixed(1)}s
    `;

    const systemPrompt = `You are designing a personalized audio experience for a user who completed the Tide attention test. Their attention type is: ${typeNames[type] || type}.
Their game data: ${humanReadableData}

Generate a JSON response with exactly two parts:

PART 1: description (three short paragraphs in English)

aboutTheSound: 2-3 sentences describing the actual audio characteristics of the soundscape they are about to hear. Reference frequency range, layering, reverb, rhythm. Make it specific to their data. Start with "This is the sound of ${typeNames[type] || type}."

recommendedMusic: Start with "Music that resonates with this attention type:" then list 3-5 specific artists or albums in ambient, modern classical, or generative music. Be specific (e.g., "Brian Eno's Music for Airports", "Stars of the Lid", "Tim Hecker's Ravedeath 1972").

howOthersHaveUsedIt: Start with "How others have used it:" then 2-3 sentences describing how people with this attention type tend to use this kind of music. Describe scenarios (writing, coding, quiet mornings) without prescribing. Use "How others have used it:" as the exact opening.

Tone rules:
- Direct, calm, confident
- No wellness language, no therapy framing
- Treat the user as an adult
- English only

PART 2: soundscape (parameters for Tone.js real-time modulation of the base MP3)

reverbDecay: number between 1-8 seconds. Longer for users with high longestDwell (>10000ms = 6-8s, <3000ms = 1-3s)
filterCutoff: number between 200-8000 Hz. Brighter (higher) for higher periphery accuracy. accuracy 1.0 = 6000-8000, accuracy 0 = 200-400
targetVolume: number between -30 and -15 dB. Louder for higher tapCount (>30 taps = -15 to -18, <10 taps = -25 to -30)
fadeInDuration: number in seconds, default 3

Output ONLY valid JSON. No preamble, no markdown, no explanation. Just the JSON object.

Example structure:
{
  "description": {
    "aboutTheSound": "...",
    "recommendedMusic": "...",
    "howOthersHaveUsedIt": "..."
  },
  "soundscape": {
    "reverbDecay": 4,
    "filterCutoff": 3000,
    "targetVolume": -22,
    "fadeInDuration": 3
  }
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: systemPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const cleaned = content.text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Soundscape API error:", error);
    return NextResponse.json({
      description: {
        aboutTheSound:
          "This soundscape was made for your attention type. It sits in the lower frequencies, with slow oscillating layers and a generous reverb tail.",
        recommendedMusic:
          "Music that resonates with this attention type: Brian Eno's Music for Airports, Stars of the Lid, Nils Frahm's Spaces.",
        howOthersHaveUsedIt:
          "How others have used it: Some play it while writing or coding. Others let it run in the background of a quiet morning.",
      },
      soundscape: {
        reverbDecay: 4,
        filterCutoff: 2000,
        targetVolume: -22,
        fadeInDuration: 3,
      },
    });
  }
}
