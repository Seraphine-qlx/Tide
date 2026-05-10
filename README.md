# Tide / 潮

*A small experiment in attention as aesthetic experience.*

**[Experience it →](https://tide-lilac.vercel.app)**

---

## What Tide is

Tide is a five-minute web experience. Through five short games, it reads how you pay attention. It then offers back a portrait of your attention type, an ambient soundscape made for that type, and a final archive of the traces you left behind.

Five attention types: **潮 Tide** · **山 Mountain** · **镜 Mirror** · **溪 Stream** · **萤 Firefly**

Each type has its own visual language, its own ambient soundscape, its own meditation text generated for that session, and its own archive of perceptual traces on the final page.

## Why I made this

I have ADHD. My attention has more often been called a problem than a particular kind of pattern. I made Tide for people whose minds run faster than they want them to, and for the question that follows: can the same AI tools that have been used to optimize and standardize attention also be used to honor its variety?

Tide is a sketch. It reads behavior as a stand-in for signals it cannot yet read directly. The next step, beyond this version, is to drive the same generative system from physiological or neural input — a direction with precedent in works like Lisa Park's *Eunoia* (2013), which used EEG to translate the artist's attention and meditation states into water-vibrating sound in real time.

## How it works

The five games each measure a different facet of attention: tracking precision (Drift), peripheral awareness (Periphery), internal rhythm (Pulse), perceptual preference (Glimpse), and attentional flow (Current). Game data is scored across the five attention archetypes; the highest-scoring archetype determines the user's type.

The result page renders a procedurally generated portrait from the user's specific data, alongside type-specific descriptions of where this kind of attention shows up in life.

The meditation page plays a Suno-generated base track, modulated in real time by Tone.js with parameters (reverb decay, filter cutoff, volume) derived from the user's data. Three paragraphs of accompanying text are generated per-session by the Claude API, conditioned on the user's type and game data, in the user's display language.

The final page is a perception archive: three layered visualizations of the user's actual game traces (cursor path, click rhythm, peripheral awareness), shown over twenty seconds with synchronized factual data lines. No commentary. No interpretation.

## Research lineage

Tide is in conversation with work coming out of Monash SensiLab:

- **Krol, Llano, Butler & Goncu (2024)** — Design considerations for automatic musical soundscapes for people with blindness or low vision. *AI-generated aesthetic experience designed for sensory difference* — the closest methodological parallel.
- **Rajcic, Llano & McCormack (2024, CHI)** — Diffractive analysis of prompt-based generative AI fine-tuned per artist. *How the same AI shapes different practitioners differently.*
- **Yang, Llano & McCormack (2024)** — Real-time music-to-image systems for creative inspiration. *Tight perception-to-generation loops.*

## Stack

`Next.js 14 (App Router)` · `TypeScript` · `Tailwind CSS` · `Framer Motion` · `Tone.js` · `Suno` · `Anthropic Claude API` · `Vercel`

## Run locally

```bash
git clone https://github.com/Seraphine-qlx/Tide.git
cd Tide
npm install
# Add your Claude API key to .env.local:
# ANTHROPIC_API_KEY=...
npm run dev
```

## Credits

- **Calligraphy** (the five hand-written brush characters): created by the author.
- **Music**: generated with Suno, modulated in real time with Tone.js.
- **Meditation text**: generated per-session with Claude.
- **Code**: written with Claude Code as pair programmer.

## About

Made by **Seraphine**, May 2026. Master of AI, Monash University.

Podcast: 文明的毛边 (*The Frayed Edges of Civilization*).

## License

Code: MIT. Calligraphy and creative content: all rights reserved by the author; please ask before reuse.
