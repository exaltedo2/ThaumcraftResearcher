# Thaumcraft Researcher

A modern, fast, and feature-rich aspect routing solver for the Thaumcraft 4 research minigame. Build complex aspect connections instantly, easily enable/disable add-on mods, and even add your own custom aspects!

## Features
- **Instant Pathfinding:** A Prim-Dijkstra hybrid solver dynamically generates optimized routes across the hex grid instantly.
- **Mod Support:** Built-in support for Thaumcraft 4 Base Game, GregTech, GT++, MagicBees, and Forbidden Magic aspects.
- **Custom Aspects:** Add custom aspects on the fly, blending parent colors to generate unique visual icons.
- **Modern UI:** Glassmorphism design, spatial overlapping layout, drag-and-drop mechanics, and high-quality aspect graphics.
- **Preferences:** "Use More" prioritization lets you favor certain aspects to burn through excess research points.
- **Mobile Friendly:** A responsive layout plus a tap-to-select/tap-to-place flow (tap an empty hex with nothing selected to toggle gaps) for phones and tablets, no dragging required.

## How to Use
Visit the live site: [Thaumcraft Researcher](https://exaltedo2.github.io/ThaumcraftResearcher/)

1. Drag and drop aspects from the sidebar onto the active hex grid endpoints (on mobile: tap an aspect, then tap a hex).
2. Select which mods or specific aspects you have enabled.
3. Click **Research!** to instantly find the shortest path connecting all your endpoints.
4. If you don't like a path, click "Research!" again to randomly generate alternative equal-cost paths.

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

## Contact & Feedback
If you have any suggestions, feature requests, or just want to reach out, feel free to contact me:
- **Discord:** `exaltedo2`
