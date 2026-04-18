# How to install this README

The upgrade keeps every fact from your current README and layers it on top
of five custom SVG assets plus badges, typed-text animations, a Mermaid
diagram, and a capsule-render footer. All rendered natively by GitHub —
no external services that could disappear except the standard
`readme-typing-svg` and shields.io (both reliable).

## What's in the bundle

```
readme-package/
├── README.md                          ← replaces your current root README
├── .github/
│   └── assets/
│       ├── banner.svg                 ← hero (orbiting icons, animated gradient)
│       ├── app-preview.svg            ← realistic UI mockup (sidebar + chat + insights)
│       ├── features-grid.svg          ← 9 illustrated feature cards
│       ├── pipeline.svg               ← 6-stage document processing animation
│       └── tech-stack.svg             ← scrolling marquee of technologies
└── INSTALL.md                         ← this file (don't copy to repo)
```

## Install (2 minutes)

From your project root on your Mac:

```bash
cd ~/Documents/Projects/ai-notebook-llm

# Back up current README just in case
mv README.md README.old.md

# Copy the new README in place
cp /path/to/extracted/readme-package/README.md ./README.md

# Make the assets folder if it doesn't exist
mkdir -p .github/assets

# Copy the SVGs
cp /path/to/extracted/readme-package/.github/assets/*.svg .github/assets/
```

Verify:

```bash
ls -la .github/assets/
# Should show 5 .svg files
```

Commit and push:

```bash
git add README.md .github/assets/
git commit -m "Premium README with animated SVG assets"
git push
```

Open `https://github.com/Aadithyaar22/ai-notebook-llm` — everything animates.

## What's genuinely animated

**Banner** (`banner.svg`)
- Four icons orbiting the title (document, chat, brain, sparkle)
- Title gradient cycles through violet → blue → pink → violet
- Two ambient glows drift slowly across the background
- Constellation dots pulse at different rates
- Accent line sweeps back and forth

**App preview** (`app-preview.svg`)
- Static but realistic — shows the actual UI layout with sidebar, chat, and insights panel. Like a product screenshot but rendered in SVG so it scales.

**Features grid** (`features-grid.svg`)
- Static illustrations across 9 feature tiles. Each has a custom visualization that communicates what the feature does without a single screenshot.

**Pipeline** (`pipeline.svg`)
- Three colored particles (violet, blue, pink) travel along the pipeline line with staggered timing, creating a continuous flow effect.

**Tech stack marquee** (`tech-stack.svg`)
- Horizontally scrolls through all 10 technologies in a seamless infinite loop. Edge-faded so it doesn't cut off abruptly.

## In the markdown itself

- **Typed intro** via `readme-typing-svg.demolab.com` — 4 lines of text type out and delete, cycling forever
- **Shields.io badges** — 10+ badges for stack, status, license, deploy
- **Mermaid architecture diagram** — GitHub renders this natively, no external service
- **Feature tables** with Twemoji icons served from jsDelivr CDN
- **Collapsible `<details>` sections** for API surface and deep-dives (keeps the top-scroll clean)
- **Capsule-render wave footer** — animated gradient wave at the bottom

## Customization

**Change the gradient colors**
In any `.svg`, find the `<linearGradient>` or `<radialGradient>` definitions near the top. Default palette: `#8b5cf6` (violet), `#60a5fa` (blue), `#f0abfc` (pink), `#34d399` (green), `#fbbf24` (amber), `#fb7185` (red).

**Change the hero title**
`banner.svg` → find `<text>NEXUS</text>` and change it. The subtitle says
`A I   T H I N K I N G   W O R K S P A C E` with deliberate letter spacing
for that premium feel.

**Change the typed text lines**
Find the `readme-typing-svg.demolab.com` URL in `README.md`. The `lines=`
parameter has semicolon-separated phrases, URL-encoded.

**Disable animations entirely**
If you want the README to be calm/static, replace any `<animate>` tags with
their `to` value as the final attribute value. I'd argue against this — the
subtle motion is what makes it feel alive.

## What's preserved from your original README

Every single fact:
- All 10 features with their exact names and descriptions
- Full setup instructions (backend + frontend)
- Every environment variable
- Architecture description including chunking, embeddings, retrieval, generation
- Provider rationale (Groq vs OpenRouter, HF vs OpenAI, browser vs ElevenLabs)
- Full API surface (22 endpoints)
- Cost breakdown (all $0)
- Deployment link to DEPLOYMENT.md
- License and contribution notes

Nothing was deleted. Sections were expanded, rearranged, and visually
upgraded — but the content is a strict superset of the original.

`diff README.old.md README.md` will show you every substantive change.

## Troubleshooting

**Images don't load on GitHub**
The `.github/assets/` folder didn't get committed. Run `git status` — if the
SVGs are untracked, `git add .github/assets/` and commit.

**Banner is static on my IDE but moves on GitHub**
That's expected. GitHub's markdown renderer supports SMIL animations inside
SVG. Most IDEs render SVGs as static previews.

**Mermaid diagram shows as plain code**
You're viewing the README outside of GitHub. The Mermaid renderer is
GitHub-specific for markdown files.

**Typed text animation doesn't appear**
`readme-typing-svg.demolab.com` is an external service. If it's down, that
specific animation won't load but nothing else breaks. You can replace the
URL with a static image if you want to guarantee availability.
