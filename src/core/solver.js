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

        // Clear existing paths first
        this.clearPaths();

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
                
                // If this node is one of the unreached endpoints, remove it from the unreached list
                const idx = unreachedEndpoints.findIndex(e => e.q === node.q && e.r === node.r);
                if (idx !== -1) {
                    unreachedEndpoints.splice(idx, 1);
                }
            }

            finalPaths.push(path);
        }

        if (unreachedEndpoints.length > 0) {
            // Failed to connect all endpoints
            return null;
        }

        this.applyPathsToGrid(finalPaths);
        return finalPaths;
    }

    clearPaths() {
        this.grid.getAllHexes().forEach(hex => {
            if (hex.state === 'has_aspect' && !hex.isEndpoint) {
                // Wait, we need to know if it's user placed or algorithm placed.
                // Actually, right-click sets state to has_aspect and aspect=id.
                // We should distinguish user endpoints from solver paths.
            }
        });
        // We will just manage this via UI classes and properties.
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
            const currentHex = this.grid.getHex(current.q, current.r);
            const neighbors = this.grid.getNeighbors(current.q, current.r);
            
            // Allow connections to any endpoint aspect, even if disabled
            const forceAspects = targetEndpoints.map(e => e.aspect);
            const validNextAspects = this.graph.getValidConnections(current.aspect, forceAspects);

            for (const neighbor of neighbors) {
                // If neighbor is inactive, skip
                if (neighbor.state === 'inactive') continue;

                if (neighbor.state === 'active_empty') {
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
                } else if (neighbor.state === 'has_aspect') {
                    // It's an endpoint (or an already placed aspect)
                    // We can only step onto it if its aspect is in our valid next aspects
                    if (validNextAspects.includes(neighbor.aspect)) {
                        const stepCost = 0; // Cost to step on an existing endpoint is 0 (or minimal)
                        const newCost = costSoFar.get(currentKey) + stepCost;
                        const nextKey = getStateKey(neighbor.q, neighbor.r, neighbor.aspect);

                        if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)) {
                            costSoFar.set(nextKey, newCost);
                            cameFrom.set(nextKey, current);
                            pq.enqueue({ q: neighbor.q, r: neighbor.r, aspect: neighbor.aspect }, newCost);
                        }
                    }
                }
            }
        }

        return null;
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

    applyPathsToGrid(finalPaths) {
        // We will emit an event or return the paths so the UI can render them
        // The UI will be responsible for drawing the "is-path" style and aspects
    }
}
