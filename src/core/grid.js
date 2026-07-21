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

    // Every hex exactly `radius` steps from the center, walked in angular
    // order around the board -- matches Thaumcraft's own research table,
    // which places its endpoint aspects around the board's outer ring
    // rather than scattering them across the whole disk.
    getRing(radius) {
        if (radius <= 0) {
            const center = this.getHex(0, 0);
            return center ? [center] : [];
        }
        const directions = [
            [1, 0], [1, -1], [0, -1],
            [-1, 0], [-1, 1], [0, 1]
        ];
        let q = directions[4][0] * radius;
        let r = directions[4][1] * radius;
        const results = [];
        for (let side = 0; side < 6; side++) {
            for (let step = 0; step < radius; step++) {
                const hex = this.getHex(q, r);
                if (hex) results.push(hex);
                q += directions[side][0];
                r += directions[side][1];
            }
        }
        return results;
    }

    getEndpoints() {
        return this.getAllHexes().filter(h => h.state === 'has_aspect' && h.aspect !== null);
    }
}
