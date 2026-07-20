import { AspectDatabase } from './data/aspects.js';
import { gtnhResearch } from './data/gtnhResearch.js';
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
            gridSize: currentRadius,
            compactMode: !!db.compactMode
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
            db.compactMode = !!config.compactMode;
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

    // 6b. GTNH Research Picker
    const modLabels = {
        thaumcraft: 'Thaumcraft',
        thaumicbases: 'Thaumic Bases',
        thaumichorizons: 'Thaumic Horizons',
        thaumicexploration: 'Thaumic Exploration',
        thaumicmachina: 'Thaumic Machina',
        thaumictinkerer: 'Thaumic Tinkerer',
        thaumicboots: 'Thaumic Boots',
        thaumicinsurgence: 'Thaumic Insurgence',
    };

    const applyResearch = (research) => {
        const mappedRadius = Math.max(2, Math.min(5, research.radius || 3));
        currentRadius = mappedRadius;
        gridSizeSelect.value = currentRadius;

        grid = new HexGrid(currentRadius);
        gridRenderer.grid = grid;

        research.aspects.forEach(id => db.toggleAspect(id, true));

        // Evenly space the endpoints around the board's outer ring, starting
        // at ring index 0 -- matches Thaumcraft's own research table, which
        // (per its actual source, HexUtils.distributeRingRandomly) computes
        // a random start offset but never applies it, so real notes always
        // start from the same ring position for a given research.
        let ring = grid.getRing(currentRadius);
        if (ring.length < research.aspects.length) {
            ring = grid.getAllHexes().filter(h => h.q !== 0 || h.r !== 0);
        }
        const ringSize = ring.length;
        const spacing = ringSize / research.aspects.length;
        const usedRingIndices = new Set();
        research.aspects.forEach((aspectId, idx) => {
            let ringIndex = Math.round(idx * spacing) % ringSize;
            while (usedRingIndices.has(ringIndex)) {
                ringIndex = (ringIndex + 1) % ringSize;
            }
            usedRingIndices.add(ringIndex);

            const cell = ring[ringIndex];
            if (!cell) return;
            grid.setHexState(cell.q, cell.r, 'has_aspect', aspectId);
            cell.isEndpoint = true;
        });

        // Deliberately no blank/gap hexes here: the real research table
        // rolls those randomly per note, which this tool can never predict
        // or match -- and this feature exists to solve a research, not to
        // recreate its random layout, so every non-endpoint hex stays open
        // pathway space for the solver to use.
        gridRenderer.selectedAspectId = null;
        aspectListUI.clearSelection();
        aspectListUI.render(); // also persists enabled aspects + grid size
        gridRenderer.render();
    };

    const researchSearchInput = document.getElementById('research-search');
    const researchResults = document.getElementById('research-results');

    const renderResearchResults = (query) => {
        researchResults.innerHTML = '';
        const q = query.trim().toLowerCase();
        if (!q) {
            researchResults.classList.remove('visible');
            return;
        }

        const matches = gtnhResearch.filter(r => r.name.toLowerCase().includes(q)).slice(0, 30);
        if (matches.length === 0) {
            researchResults.innerHTML = '<div class="research-empty">No matching research found.</div>';
            researchResults.classList.add('visible');
            return;
        }

        matches.forEach(r => {
            const item = document.createElement('div');
            item.className = 'research-result-item';
            item.innerHTML = `
                <div class="research-result-name">${r.name}</div>
                <div class="research-result-meta">${modLabels[r.mod] || r.mod} &middot; ${r.aspects.length} aspects</div>
            `;
            item.addEventListener('click', () => {
                applyResearch(r);
                researchSearchInput.value = r.name;
                researchResults.classList.remove('visible');
            });
            researchResults.appendChild(item);
        });
        researchResults.classList.add('visible');
    };

    researchSearchInput.addEventListener('input', (e) => renderResearchResults(e.target.value));
    researchSearchInput.addEventListener('focus', (e) => {
        if (e.target.value) renderResearchResults(e.target.value);
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.research-picker')) researchResults.classList.remove('visible');
    });

    // 7. Reset Hexes Button
    const btnResetHexes = document.getElementById('btn-reset-hexes');
    btnResetHexes.addEventListener('click', () => {
        grid = new HexGrid(currentRadius);
        gridRenderer.grid = grid; // update ref
        gridRenderer.selectedAspectId = null;
        aspectListUI.clearSelection();
        gridRenderer.render();
    });

    // 8. Solver Integration
    const runSolver = () => {
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
    };

    document.getElementById('btn-research').addEventListener('click', runSolver);
    document.getElementById('btn-research-2').addEventListener('click', runSolver);

    // 9. How to Use Collapse Toggle
    const rightSidebar = document.getElementById('right-sidebar');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    btnToggleSidebar.addEventListener('click', () => {
        const collapsed = rightSidebar.classList.toggle('collapsed');
        btnToggleSidebar.textContent = collapsed ? '▶' : '◀';
    });
});
