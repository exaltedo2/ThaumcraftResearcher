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

    // 2. Initialize UI for Aspect List
    const aspectListUI = new AspectListUI(db, 'aspect-list');

    // 3. Initialize Custom Aspect Creator
    const customAspectUI = new CustomAspectUI(db, aspectListUI);

    // 4. Initialize Grid and Renderer
    let currentRadius = 3;
    let grid = new HexGrid(currentRadius);
    let gridRenderer = new GridRenderer(grid, 'grid-container', db);

    // 5. Grid Size Selector
    const gridSizeSelect = document.getElementById('grid-size');
    gridSizeSelect.addEventListener('change', (e) => {
        currentRadius = parseInt(e.target.value, 10);
        grid = new HexGrid(currentRadius);
        gridRenderer.grid = grid; // update ref
        gridRenderer.render();
    });

    // 6. Solver Integration
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
