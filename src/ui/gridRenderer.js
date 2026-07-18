export class GridRenderer {
    constructor(grid, containerId, db) {
        this.grid = grid;
        this.container = document.getElementById(containerId);
        this.db = db;
        this.selectedAspectId = null;
        this.hexSize = 40; // pixel size
        this.spacing = 1.05; // gap between hexes
        this.render();
        this.setupWindowResize();
    }

    render() {
        this.container.innerHTML = '';

        const board = document.createElement('div');
        board.className = 'grid-board';
        this.board = board;

        const hexes = this.grid.getAllHexes();

        // Calculate board dimensions (flat-top hexagons, matching Thaumcraft's own research grid)
        const width = 2 * this.hexSize;
        const height = Math.sqrt(3) * this.hexSize;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        hexes.forEach(hexData => {
            const hexEl = document.createElement('div');
            hexEl.className = `hex state-${hexData.state}`;
            hexEl.dataset.q = hexData.q;
            hexEl.dataset.r = hexData.r;

            // Axial to pixel coords (Flat top)
            const x = width * (3/4 * hexData.q) * this.spacing;
            const y = height * (hexData.q / 2 + hexData.r) * this.spacing;

            minX = Math.min(minX, x - width / 2);
            maxX = Math.max(maxX, x + width / 2);
            minY = Math.min(minY, y - height / 2);
            maxY = Math.max(maxY, y + height / 2);

            hexEl.style.width = `${width}px`;
            hexEl.style.height = `${height}px`;
            // Center 0,0 in the middle
            hexEl.style.left = `calc(50% + ${x}px - ${width/2}px)`;
            hexEl.style.top = `calc(50% + ${y}px - ${height/2}px)`;

            const inner = document.createElement('div');
            inner.className = 'hex-inner';

            const label = document.createElement('div');
            label.className = 'hex-aspect-label';
            if (hexData.state === 'has_aspect' && hexData.aspect) {
                this.setLabelContent(label, hexData.aspect);
            }

            inner.appendChild(label);
            hexEl.appendChild(inner);

            // Interactions
            this.setupHexInteractions(hexEl, hexData, label);

            board.appendChild(hexEl);
        });

        this.container.appendChild(board);

        // Remember the hex dimensions/offset so hexCenter() and renderConnections()
        // can reuse the exact same coordinate math used to position the hexes above.
        this.hexWidth = width;
        this.hexHeight = height;
        this.boardOffset = { minX, minY };

        // Natural (unscaled) footprint of the whole hex cluster, used to
        // shrink the board to fit small viewports instead of overflowing them.
        this.boardExtent = { width: maxX - minX, height: maxY - minY };
        this.applyScale();
        this.renderConnections();
    }

    // Pixel center of a hex, in the same coordinate space used to position
    // the hex elements themselves (origin at the board's center point).
    hexCenter(q, r) {
        return {
            x: this.hexWidth * (3 / 4 * q) * this.spacing,
            y: this.hexHeight * (q / 2 + r) * this.spacing,
        };
    }

    // Draws a thin line between every pair of geometrically-adjacent placed
    // hexes that actually have a valid parent/child relationship, so it's
    // visually obvious which touching hexes are "really" connected versus
    // just happening to sit next to each other.
    renderConnections() {
        if (!this.board || !this.boardExtent) return;

        const existing = this.board.querySelector('.connection-lines');
        if (existing) existing.remove();

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'connection-lines');
        svg.setAttribute('width', this.boardExtent.width);
        svg.setAttribute('height', this.boardExtent.height);
        svg.style.left = `calc(50% + ${this.boardOffset.minX}px)`;
        svg.style.top = `calc(50% + ${this.boardOffset.minY}px)`;

        const placedHexes = this.grid.getAllHexes().filter(h => h.state === 'has_aspect' && h.aspect);
        const seenPairs = new Set();

        placedHexes.forEach(hex => {
            const aspect = this.db.getAspect(hex.aspect);
            if (!aspect) return;

            this.grid.getNeighbors(hex.q, hex.r).forEach(neighbor => {
                if (neighbor.state !== 'has_aspect' || !neighbor.aspect) return;

                const pairKey = [`${hex.q},${hex.r}`, `${neighbor.q},${neighbor.r}`].sort().join('|');
                if (seenPairs.has(pairKey)) return;
                seenPairs.add(pairKey);

                const neighborAspect = this.db.getAspect(neighbor.aspect);
                if (!neighborAspect) return;

                const isValid = aspect.components.includes(neighborAspect.id) || neighborAspect.components.includes(aspect.id);
                if (!isValid) return;

                const c1 = this.hexCenter(hex.q, hex.r);
                const c2 = this.hexCenter(neighbor.q, neighbor.r);

                const line = document.createElementNS(svgNS, 'line');
                line.setAttribute('x1', c1.x - this.boardOffset.minX);
                line.setAttribute('y1', c1.y - this.boardOffset.minY);
                line.setAttribute('x2', c2.x - this.boardOffset.minX);
                line.setAttribute('y2', c2.y - this.boardOffset.minY);
                line.setAttribute('class', 'connection-line');
                svg.appendChild(line);
            });
        });

        this.board.insertBefore(svg, this.board.firstChild);
    }

    applyScale() {
        if (!this.board || !this.boardExtent || this.boardExtent.width <= 0) return;

        const containerRect = this.container.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) return;

        const padding = 0.9; // leave a little breathing room
        const scale = Math.min(
            1,
            (containerRect.width * padding) / this.boardExtent.width,
            (containerRect.height * padding) / this.boardExtent.height
        );

        this.board.style.transform = `scale(${scale})`;
    }

    setLabelContent(label, aspectId) {
        if (!aspectId) {
            label.innerHTML = '';
            return;
        }
        const aspectObj = this.db.getAspect(aspectId);
        const name = aspectObj ? aspectObj.name : aspectId;
        const color = aspectObj ? aspectObj.color : '#ffffff';
        const isCustom = aspectObj ? aspectObj.isCustom : false;
        
        let iconHtml = '';
        if (isCustom) {
            iconHtml = `<div class="hex-aspect-icon" style="background-color: ${color}; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);"></div>`;
        } else {
            const imageUrl = `./assets/aspects/${aspectId}.png?v=7`;
            iconHtml = `<div class="hex-aspect-icon color-mask" style="-webkit-mask-image: url('${imageUrl}'); mask-image: url('${imageUrl}'); background-color: ${color};"></div>`;
        }

        label.innerHTML = `
            ${iconHtml}
            <span class="hex-aspect-name">${name}</span>
        `;
    }

    setupHexInteractions(hexEl, hexData, label) {
        // Right click (desktop): has_aspect -> active_empty -> inactive -> active_empty
        hexEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleGapCycle(hexData, hexEl, label);
        });

        // Click / tap: place the selected aspect, or clear one that's already placed.
        // Touch devices have no right-click, so a plain tap on an empty/inactive
        // hex with nothing selected toggles the gap there instead. On desktop
        // (a device with a real mouse) that same click does nothing, so an
        // ordinary left-click can never silently turn a hex into a void.
        hexEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearPaths();

            const isTouch = !window.matchMedia('(hover: hover)').matches;

            if (hexData.state === 'has_aspect') {
                this.grid.setHexState(hexData.q, hexData.r, 'active_empty');
                hexData.isEndpoint = false;
            } else if (hexData.state === 'active_empty') {
                if (this.selectedAspectId) {
                    this.grid.setHexState(hexData.q, hexData.r, 'has_aspect', this.selectedAspectId);
                    hexData.isEndpoint = true;
                } else if (isTouch) {
                    this.grid.setHexState(hexData.q, hexData.r, 'inactive');
                }
            } else if (hexData.state === 'inactive' && isTouch) {
                this.grid.setHexState(hexData.q, hexData.r, 'active_empty');
            }

            this.updateHexVisuals(hexEl, hexData, label);
        });

        // Drag and Drop
        hexEl.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            if (hexData.state === 'active_empty') {
                hexEl.classList.add('drag-over');
            }
        });

        hexEl.addEventListener('dragleave', () => {
            hexEl.classList.remove('drag-over');
        });

        hexEl.addEventListener('drop', (e) => {
            e.preventDefault();
            hexEl.classList.remove('drag-over');

            if (hexData.state === 'active_empty') {
                const aspectId = e.dataTransfer.getData('text/plain');
                if (aspectId) {
                    this.clearPaths();
                    this.grid.setHexState(hexData.q, hexData.r, 'has_aspect', aspectId);
                    // Mark as an endpoint for clearing logic
                    hexData.isEndpoint = true; 
                    this.updateHexVisuals(hexEl, hexData, label);
                }
            }
        });
    }

    toggleGapCycle(hexData, hexEl, label) {
        this.clearPaths();

        if (hexData.state === 'has_aspect') {
            this.grid.setHexState(hexData.q, hexData.r, 'active_empty');
            hexData.isEndpoint = false;
        } else if (hexData.state === 'active_empty') {
            this.grid.setHexState(hexData.q, hexData.r, 'inactive');
        } else if (hexData.state === 'inactive') {
            this.grid.setHexState(hexData.q, hexData.r, 'active_empty');
        }

        this.updateHexVisuals(hexEl, hexData, label);
    }

    updateHexVisuals(hexEl, hexData, label) {
        hexEl.className = `hex state-${hexData.state}`;
        if (hexData.state === 'has_aspect' && hexData.aspect) {
            this.setLabelContent(label, hexData.aspect);
        } else {
            label.innerHTML = '';
        }
        this.renderConnections();
    }

    clearPaths() {
        const hexes = this.grid.getAllHexes();
        hexes.forEach(hexData => {
            if (hexData.state === 'has_aspect' && !hexData.isEndpoint) {
                this.grid.setHexState(hexData.q, hexData.r, 'active_empty');
            }
        });

        // Re-render
        const hexEls = this.board.querySelectorAll('.hex');
        hexEls.forEach(el => {
            const q = parseInt(el.dataset.q, 10);
            const r = parseInt(el.dataset.r, 10);
            const hexData = this.grid.getHex(q, r);
            el.className = `hex state-${hexData.state}`;
            
            const label = el.querySelector('.hex-aspect-label');
            if (hexData.state === 'has_aspect' && hexData.aspect) {
                this.setLabelContent(label, hexData.aspect);
            } else {
                label.innerHTML = '';
            }
        });

        this.renderConnections();
    }

    drawPaths(paths) {
        this.clearPaths();
        
        paths.forEach(path => {
            path.forEach(node => {
                const hexData = this.grid.getHex(node.q, node.r);
                if (hexData && !hexData.isEndpoint) {
                    this.grid.setHexState(node.q, node.r, 'has_aspect', node.aspect);
                }
            });
        });


        // Update visuals
        const hexEls = this.board.querySelectorAll('.hex');
        hexEls.forEach(el => {
            const q = parseInt(el.dataset.q, 10);
            const r = parseInt(el.dataset.r, 10);
            const hexData = this.grid.getHex(q, r);
            
            el.className = `hex state-${hexData.state}`;
            
            // Highlight non-endpoint path hexes
            if (hexData.state === 'has_aspect' && !hexData.isEndpoint) {
                el.classList.add('is-path');
            }

            const label = el.querySelector('.hex-aspect-label');
            if (hexData.state === 'has_aspect' && hexData.aspect) {
                this.setLabelContent(label, hexData.aspect);
            } else {
                label.innerHTML = '';
            }
        });

        this.renderConnections();
    }

    setupWindowResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.applyScale(), 100);
        });
        window.addEventListener('orientationchange', () => this.applyScale());
    }
}
