# Thaumcraft Researcher

A modern, fast, and feature-rich aspect routing solver for the Thaumcraft 4 research minigame. Build complex aspect connections instantly, easily enable/disable add-on mods, and even add your own custom aspects!

## Features
- **Instant Pathfinding:** A Prim-Dijkstra hybrid solver dynamically generates optimized routes across the hex grid instantly.
- **Mod Support:** Built-in support for Thaumcraft 4 Base Game, GregTech, GT++, MagicBees, and Forbidden Magic aspects.
- **Custom Aspects:** Add custom aspects on the fly, blending parent colors to generate unique visual icons.
- **Modern UI:** Glassmorphism design, spatial overlapping layout, drag-and-drop mechanics, and high-quality aspect graphics.
- **Preferences:** "Use More" prioritization lets you favor certain aspects to burn through excess research points.

## How to Use
Visit the live site: [Thaumcraft Researcher](https://exaltedo2.github.io/ThaumcraftResearcher/)

1. Drag and drop aspects from the sidebar onto the active hex grid endpoints.
2. Select which mods or specific aspects you have enabled.
3. Click **Research!** to instantly find the shortest path connecting all your endpoints.
4. If you don't like a path, click "Research!" again to randomly generate alternative equal-cost paths.

## Development
This application was entirely written, designed, debugged, and optimized by an AI (Google's Antigravity coding assistant) in pair-programming collaboration with its creator.

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
HQ Aspect image masks are adapted from `universal_tc_research_solver`.
