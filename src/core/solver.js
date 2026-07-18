class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    dequeue() {
        return this.elements.shift().element;
    }
    isEmpty() {
        return this.elements.length === 0;
    }
}

export class Solver {
    constructor(grid, aspectGraph) {
        this.grid = grid;
        this.graph = aspectGraph;
    }

    solve() {
        const endpoints = this.grid.getEndpoints();
        if (endpoints.length < 2) return null; // Nothing to connect

        // Scratch occupancy map for this solve only ("q,r" -> aspect id),
        // seeded with the real user-placed endpoints. The search reads/writes
        // this instead of the live grid, so a failed or partial solve never
        // leaves stray mutations on the shared grid for a caller to clean up
        // -- the caller stays responsible for applying the result (or not).
        this.placements = new Map();
        endpoints.forEach(e => this.placements.set(`${e.q},${e.r}`, e.aspect));

        // Connected set of hexes (includes endpoints and intermediate paths)
        // Set of { q, r, aspect }
        const connectedSet = [];
        const unreachedEndpoints = [...endpoints];

        // Start with the first endpoint
        const startNode = unreachedEndpoints.shift();
        connectedSet.push({ q: startNode.q, r: startNode.r, aspect: startNode.aspect });

        const finalPaths = [];

        // Prim-Dijkstra hybrid to connect all endpoints
        while (unreachedEndpoints.length > 0) {
            const path = this.findShortestPathFromSet(connectedSet, unreachedEndpoints);

            if (!path) {
                console.warn("Could not find a path to remaining endpoints.");
                break; // Unsolvable
            }

            // Path found! Add the path nodes to the connected set
            for (let i = 1; i < path.length; i++) { // Skip index 0 as it's already in connectedSet
                const node = path[i];
                connectedSet.push(node);
                this.placements.set(`${node.q},${node.r}`, node.aspect);

                // If this node is one of the unreached endpoints, remove it from the unreached list
                const idx = unreachedEndpoints.findIndex(e => e.q === node.q && e.r === node.r);
                if (idx !== -1) {
                    unreachedEndpoints.splice(idx, 1);
                }
            }

            finalPaths.push(path);
        }

        this.placements = null;

        if (unreachedEndpoints.length > 0) {
            // Failed to connect all endpoints
            return null;
        }

        return finalPaths;
    }

    // Finds the shortest path from ANY node in connectedSet to ANY node in targetEndpoints
    findShortestPathFromSet(connectedSet, targetEndpoints) {
        const pq = new PriorityQueue();
        const cameFrom = new Map();
        const costSoFar = new Map();

        // State key: "q,r,aspectId"
        const getStateKey = (q, r, aspect) => `${q},${r},${aspect}`;

        // Initialize PQ with all nodes in the connected set
        for (const node of connectedSet) {
            const key = getStateKey(node.q, node.r, node.aspect);
            costSoFar.set(key, 0);
            pq.enqueue({ q: node.q, r: node.r, aspect: node.aspect }, 0);
            cameFrom.set(key, null);
        }

        while (!pq.isEmpty()) {
            const current = pq.dequeue();
            
            // Check if current is one of the target endpoints
            const isTarget = targetEndpoints.find(e => e.q === current.q && e.r === current.r && e.aspect === current.aspect);
            if (isTarget) {
                return this.reconstructPath(cameFrom, current);
            }

            const currentKey = getStateKey(current.q, current.r, current.aspect);
            const neighbors = this.grid.getNeighbors(current.q, current.r);
            
            // Allow connections to any endpoint aspect, even if disabled
            const forceAspects = targetEndpoints.map(e => e.aspect);
            const validNextAspects = this.graph.getValidConnections(current.aspect, forceAspects);

            for (const neighbor of neighbors) {
                // Gaps are real board state (user-toggled), not something
                // this solve's scratch map tracks -- always read from the grid.
                if (neighbor.state === 'inactive') continue;

                // A physical hex can only ever hold one aspect. The state key
                // is "q,r,aspect", so without this check the search could
                // revisit the same (q,r) later in the same path under a
                // different hypothetical aspect -- two different "virtual"
                // placements for one real cell, which isn't physically valid.
                if (this.pathUsesCoordinate(cameFrom, current, neighbor.q, neighbor.r)) continue;

                const neighborKey = `${neighbor.q},${neighbor.r}`;
                const claimedAspect = this.placements.get(neighborKey);

                if (claimedAspect) {
                    // Already placed -- either a real endpoint, or claimed by
                    // an earlier iteration of this same solve. Can only step
                    // onto it if it's a valid connection.
                    if (validNextAspects.includes(claimedAspect)) {
                        const stepCost = 0; // Cost to step on an existing endpoint is 0 (or minimal)
                        const newCost = costSoFar.get(currentKey) + stepCost;
                        const nextKey = getStateKey(neighbor.q, neighbor.r, claimedAspect);

                        if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)) {
                            costSoFar.set(nextKey, newCost);
                            cameFrom.set(nextKey, current);
                            pq.enqueue({ q: neighbor.q, r: neighbor.r, aspect: claimedAspect }, newCost);
                        }
                    }
                } else {
                    for (const nextAspect of validNextAspects) {
                        // Add a tiny random fraction to cost to randomize paths of equal length
                        const stepCost = this.graph.getCost(nextAspect) + (Math.random() * 0.001);
                        const newCost = costSoFar.get(currentKey) + stepCost;
                        const nextKey = getStateKey(neighbor.q, neighbor.r, nextAspect);

                        if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)) {
                            costSoFar.set(nextKey, newCost);
                            cameFrom.set(nextKey, current);
                            pq.enqueue({ q: neighbor.q, r: neighbor.r, aspect: nextAspect }, newCost);
                        }
                    }
                }
            }
        }

        return null;
    }

    // Walks the ancestor chain of `state` (via cameFrom) to check whether
    // (q, r) already appears somewhere earlier in that same candidate path.
    pathUsesCoordinate(cameFrom, state, q, r) {
        let cur = state;
        while (cur != null) {
            if (cur.q === q && cur.r === r) return true;
            const key = `${cur.q},${cur.r},${cur.aspect}`;
            cur = cameFrom.get(key);
        }
        return false;
    }

    reconstructPath(cameFrom, current) {
        const path = [];
        const getStateKey = (q, r, aspect) => `${q},${r},${aspect}`;
        
        while (current != null) {
            path.push(current);
            const key = getStateKey(current.q, current.r, current.aspect);
            current = cameFrom.get(key);
        }
        return path.reverse();
    }
}
