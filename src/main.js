import { AspectDatabase } from './data/aspects.js';
import { AspectListUI } from './ui/aspectList.js';
import { HexGrid } from './core/grid.js';
import { GridRenderer } from './ui/gridRenderer.js';
import { CustomAspectUI } from './ui/customAspect.js';
import { AspectGraph } from './core/graph.js';
import { Solver } from './core/solver.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Database
    const db = new AspectDatabase();

    // -- State Persistence --
    window.saveAppConfig = () => {
        const config = {
            enabledAspects: Array.from(db.enabledAspects),
            useMoreAspects: Array.from(db.useMoreAspects),
            customAspects: Array.from(db.aspects.values()).filter(a => a.isCustom),
            gridSize: currentRadius
        };
        localStorage.setItem('thaumcraft_researcher_config', JSON.stringify(config));
    };

    let currentRadius = 3;
    const savedConfigStr = localStorage.getItem('thaumcraft_researcher_config');
    if (savedConfigStr) {
        try {
            const config = JSON.parse(savedConfigStr);
            if (config.gridSize) currentRadius = config.gridSize;
            if (config.customAspects) {
                config.customAspects.forEach(a => db.aspects.set(a.id, a));
            }
            if (config.enabledAspects) {
                db.enabledAspects.clear();
                config.enabledAspects.forEach(id => db.enabledAspects.add(id));
            }
            if (config.useMoreAspects) {
                db.useMoreAspects.clear();
                config.useMoreAspects.forEach(id => db.useMoreAspects.add(id));
            }
        } catch (e) {
            console.error("Failed to load config", e);
        }
    }

    // 2. Initialize UI for Aspect List
    const aspectListUI = new AspectListUI(db, 'aspect-list', (aspectId) => {
        gridRenderer.selectedAspectId = aspectId;
    });

    // 3. Initialize Custom Aspect Creator
    const customAspectUI = new CustomAspectUI(db, aspectListUI);

    // 4. Initialize Grid and Renderer
    let grid = new HexGrid(currentRadius);
    let gridRenderer = new GridRenderer(grid, 'grid-container', db);

    // Tapping anywhere that isn't an aspect (to select) or a hex (to place)
    // cancels the pending placement, so a stray tap can't drop an aspect later.
    document.addEventListener('click', (e) => {
        if (!gridRenderer.selectedAspectId) return;
        if (e.target.closest('.aspect-item') || e.target.closest('.hex')) return;
        gridRenderer.selectedAspectId = null;
        aspectListUI.clearSelection();
    });

    // 5. Reset Button
    const btnReset = document.getElementById('btn-reset');
    btnReset.addEventListener('click', () => {
        if (!confirm("Reset all changes? This will clear custom aspects, enabled/disabled aspects, and grid size back to defaults.")) return;
        localStorage.removeItem('thaumcraft_researcher_config');
        location.reload();
    });

    // 6. Grid Size Selector
    const gridSizeSelect = document.getElementById('grid-size');
    gridSizeSelect.value = currentRadius;
    gridSizeSelect.addEventListener('change', (e) => {
        currentRadius = parseInt(e.target.value, 10);
        if (window.saveAppConfig) window.saveAppConfig();
        grid = new HexGrid(currentRadius);
        gridRenderer.grid = grid; // update ref
        gridRenderer.render();
    });

    // 7. Solver Integration
    const btnResearch = document.getElementById('btn-research');
    btnResearch.addEventListener('click', () => {
        // Clear paths visually and from the model BEFORE solving
        gridRenderer.clearPaths();

        const graph = new AspectGraph(db);
        const solver = new Solver(grid, graph);
        
        const paths = solver.solve();
        if (paths && paths.length > 0) {
            gridRenderer.drawPaths(paths);
        } else {
            alert("No valid path could be found to connect all endpoints with the currently enabled aspects!");
        }
    });
});
