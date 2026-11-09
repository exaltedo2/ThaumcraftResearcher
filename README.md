# Thaumcraft Researcher

A modern, fast, and feature-rich aspect routing solver for the Thaumcraft 4 research minigame. Build complex aspect connections instantly, easily enable/disable add-on mods, and even add your own custom aspects!

## Features
- **Optimal Pathfinding:** An exact solver (Dreyfus-Wagner Steiner tree over hex × aspect, with branch and bound for hexes that would need two aspects) always finds the cheapest set of placements connecting all endpoints, usually in tens of milliseconds. Boards with more than 10 endpoints fall back to the greedy solver.
- **Mod Support:** Built-in support for Thaumcraft 4 Base Game plus GTNH's full addon-mod aspect set -- GregTech, GT++, Blood Magic, Witchery, MagicBees, Forbidden Magic, Gadomancy, ThaumicBoots, and 15+ more.
- **Custom Aspects:** Add custom aspects on the fly, blending parent colors to generate unique visual icons.
- **Modern UI:** Glassmorphism design, spatial overlapping layout, drag-and-drop mechanics, and high-quality aspect graphics.
- **Preferences:** "Use More" prioritization lets you favor certain aspects to burn through excess research points.
- **Mobile Friendly:** A responsive layout plus a tap-to-select/tap-to-place flow (tap an empty hex with nothing selected to toggle gaps) for phones and tablets, no dragging required.
- **GTNH Research Picker:** Search GTNH's actual Thaumcraft research entries (base game + addon mods, including GTNH's own runtime aspect-list overrides) by name and auto-fill the grid size and required aspects for that research.

## How to Use
Visit the live site: [Thaumcraft Researcher](https://exaltedo2.github.io/ThaumcraftResearcher/)

1. Drag and drop aspects from the sidebar onto the active hex grid endpoints (on mobile: tap an aspect, then tap a hex).
2. Select which mods or specific aspects you have enabled.
3. Click **Research!** to find the cheapest set of placements connecting all your endpoints.
4. If you don't like the layout, click "Research!" again: it picks another solution at the same (minimum) cost, when one exists.

## Development
This application was built and optimized with the assistance of Claude to provide the fastest and cleanest pathfinding experience possible.

**Stack:**
- Vanilla JavaScript (ES6 Modules)
- Vanilla CSS
- Vite

### Local Setup
```bash
npm install
npm run dev
```

## Credits
- Aspect icons are the property of Azanor (creator of Thaumcraft 4).
- HQ Aspect image masks are adapted from `universal_tc_research_solver` (MIT License).
- GTNH research data (research names, required aspects, grid size) was extracted from decompiled Thaumcraft4 and GTNH mod sources, including GTNewHorizonsCoreMod's runtime research-balance overrides.

## Contact & Feedback
If you have any suggestions, feature requests, or just want to reach out, feel free to contact me:
- **Discord:** `exaltedo2`
