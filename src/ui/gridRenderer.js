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

        // Calculate board dimensions
        const width = Math.sqrt(3) * this.hexSize;
        const height = 2 * this.hexSize;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        hexes.forEach(hexData => {
            const hexEl = document.createElement('div');
            hexEl.className = `hex state-${hexData.state}`;
            hexEl.dataset.q = hexData.q;
            hexEl.dataset.r = hexData.r;

            // Axial to pixel coords (Pointy top)
            const x = width * (hexData.q + hexData.r / 2) * this.spacing;
            const y = height * (3/4 * hexData.r) * this.spacing;

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

        // Natural (unscaled) footprint of the whole hex cluster, used to
        // shrink the board to fit small viewports instead of overflowing them.
        this.boardExtent = { width: maxX - minX, height: maxY - minY };
        this.applyScale();
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
        // Right click (desktop) / long-press (touch): has_aspect -> active_empty -> inactive -> active_empty
        hexEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleGapCycle(hexData, hexEl, label);
        });

        let pressTimer = null;
        let longPressFired = false;

        hexEl.addEventListener('touchstart', () => {
            longPressFired = false;
            pressTimer = setTimeout(() => {
                longPressFired = true;
                this.toggleGapCycle(hexData, hexEl, label);
                if (navigator.vibrate) navigator.vibrate(15);
            }, 500);
        }, { passive: true });

        hexEl.addEventListener('touchend', () => clearTimeout(pressTimer));
        hexEl.addEventListener('touchmove', () => clearTimeout(pressTimer));

        // Click / tap: place the selected aspect, or clear one that's already placed.
        // Gap toggling on an empty hex is right-click / long-press only (see above) --
        // a plain click here must never silently turn an empty hex into a void.
        hexEl.addEventListener('click', (e) => {
            e.preventDefault();

            if (longPressFired) {
                longPressFired = false;
                return;
            }

            this.clearPaths();

            if (hexData.state === 'has_aspect') {
                this.grid.setHexState(hexData.q, hexData.r, 'active_empty');
                hexData.isEndpoint = false;
            } else if (hexData.state === 'active_empty' && this.selectedAspectId) {
                this.grid.setHexState(hexData.q, hexData.r, 'has_aspect', this.selectedAspectId);
                hexData.isEndpoint = true;
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
