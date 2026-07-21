export class HexGrid {
    constructor(radius) {
        this.radius = radius;
        this.hexes = new Map(); // key: "q,r", value: HexNode
        this.generateGrid();
    }

    generateGrid() {
        for (let q = -this.radius; q <= this.radius; q++) {
            let r1 = Math.max(-this.radius, -q - this.radius);
            let r2 = Math.min(this.radius, -q + this.radius);
            for (let r = r1; r <= r2; r++) {
                this.hexes.set(`${q},${r}`, {
                    q, r,
                    state: 'active_empty', // active_empty, inactive, has_aspect
                    aspect: null
                });
            }
        }
    }

    getHex(q, r) {
        return this.hexes.get(`${q},${r}`);
    }

    setHexState(q, r, state, aspect = null) {
        const hex = this.getHex(q, r);
        if (hex) {
            hex.state = state;
            hex.aspect = aspect;
        }
    }

    getNeighbors(q, r) {
        const directions = [
            [1, 0], [1, -1], [0, -1],
            [-1, 0], [-1, 1], [0, 1]
        ];
        const neighbors = [];
        for (const [dq, dr] of directions) {
            const n = this.getHex(q + dq, r + dr);
            if (n) neighbors.push(n);
        }
        return neighbors;
    }

    getAllHexes() {
        return Array.from(this.hexes.values());
    }

    getEndpoints() {
        return this.getAllHexes().filter(h => h.state === 'has_aspect' && h.aspect !== null);
    }
}
