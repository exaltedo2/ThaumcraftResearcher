import { Solver } from './solver.js';

// Exact solver: finds a cheapest set of placements that connects every endpoint.
//
// The board is modelled as a graph whose nodes are (hex, aspect) pairs. An endpoint hex has a
// single node (its fixed aspect, cost 0); every other active hex has one node per usable aspect,
// costing AspectGraph.getCost(aspect). Two nodes are linked when their hexes are neighbours and
// their aspects can connect. Connecting all endpoints as cheaply as possible is then a
// node-weighted Steiner tree problem, solved exactly with the Dreyfus-Wagner dynamic programme:
//
//   dp[S][v] = cost of the cheapest tree that contains node v and connects the endpoint set S
//
// rooted at the last endpoint, so it runs over 2^(k-1) endpoint subsets. It is exponential only
// in the number of endpoints k (research notes have at most ~10), not in the board size.
//
// The DP does not know that a physical hex holds a single aspect, so the cheapest tree can
// occasionally use one hex twice with two different aspects. When that happens the solver
// branches (branch and bound): one sub-problem per aspect the hex may keep, the others banned
// there. Sub-problems are explored cheapest-first and banning nodes can only raise the cost,
// so the first conflict-free tree found is optimal.
//
// The greedy solver is kept as a safety net: above `maxExactEndpoints`, or if branching ever
// needs more than `maxBranchSolves` DP runs.

const DEFAULT_MAX_EXACT_ENDPOINTS = 10;
const DEFAULT_MAX_BRANCH_SOLVES = 40;

// Tiny random cost added to every free node, so that clicking "Research!" again picks a different
// one among equally cheap solutions. Even summed over a whole radius-5 board (91 hexes) it stays
// below 0.01, far under the smallest real cost step (0.5), so it never changes which cost is optimal.
const TIE_NOISE = 1e-4;

export class ExactSolver {
    constructor(grid, aspectGraph, options = {}) {
        this.grid = grid;
        this.graph = aspectGraph;
        this.maxExactEndpoints = options.maxExactEndpoints ?? DEFAULT_MAX_EXACT_ENDPOINTS;
        this.maxBranchSolves = options.maxBranchSolves ?? DEFAULT_MAX_BRANCH_SOLVES;
        this.greedyRestartsPerEndpoint = options.greedyRestartsPerEndpoint ?? 2;
        // Time budget for the greedy restarts: the original greedy can take a few hundred ms per run
        // on a large board, so stop restarting once this is spent (at least one run always happens).
        this.fallbackBudgetMs = options.fallbackBudgetMs ?? 1500;
        // For tests/debugging: which method produced the last result ('exact' | 'greedy-fallback')
        // and how many DP runs the exact search needed (1 unless it had to branch).
        this.lastMethod = null;
        this.lastDpRuns = 0;
    }

    // Same contract as Solver.solve(): an array of paths (arrays of {q, r, aspect}) covering the
    // endpoints and every placed aspect, or null when the endpoints cannot be connected.
    solve() {
        const endpoints = this.grid.getEndpoints();
        if (endpoints.length < 2) return null;

        if (endpoints.length > this.maxExactEndpoints) {
            return this.greedyFallback(endpoints);
        }

        const result = this.solveExact(endpoints);
        if (result === 'gave-up') return this.greedyFallback(endpoints);
        this.lastMethod = 'exact';
        return result === null ? null : [result];
    }

    // Returns the optimal list of {q, r, aspect}, null if the endpoints cannot be connected,
    // or 'gave-up' if branching exceeded maxBranchSolves.
    solveExact(endpoints) {
        const model = this.buildModel(endpoints);
        const first = this.runDP(model, new Set());
        this.lastDpRuns = 1;
        // Not even the relaxed problem (a hex may hold two aspects) has a solution: neither has the real one.
        if (first === null) return null;
        const open = [{ banned: new Set(), tree: first }];

        while (open.length > 0) {
            // Cheapest open sub-problem first.
            let bestIdx = 0;
            for (let i = 1; i < open.length; i++) if (open[i].tree.cost < open[bestIdx].tree.cost) bestIdx = i;
            const { banned, tree } = open.splice(bestIdx, 1)[0];

            const conflict = this.findConflict(model, tree.nodes);
            if (!conflict) return this.toPlacements(model, tree.nodes);

            // Branch: keep one of the clashing aspects on that hex, ban the others there.
            for (const keep of conflict) {
                if (this.lastDpRuns >= this.maxBranchSolves) return 'gave-up';
                const childBanned = new Set(banned);
                for (const v of conflict) if (v !== keep) childBanned.add(v);
                this.lastDpRuns++;
                const child = this.runDP(model, childBanned);
                if (child) open.push({ banned: childBanned, tree: child });
            }
        }
        return null;
    }

    // Graph of (hex, aspect) nodes. Built once per solve, so the tie-breaking noise stays the
    // same across all branches of the search.
    buildModel(endpoints) {
        const forced = endpoints.map(e => e.aspect);

        // Aspects allowed on a free hex: the same set the greedy solver uses
        // (enabled aspects, plus the endpoints' own aspects even if disabled).
        const usable = new Set(this.graph.db.getEnabledAspects().map(a => a.id));
        forced.forEach(a => usable.add(a));
        const links = new Map();
        for (const a of usable) links.set(a, new Set(this.graph.getValidConnections(a, forced)));

        const endpointAspect = new Map(endpoints.map(e => [`${e.q},${e.r}`, e.aspect]));
        const nodeQ = [], nodeR = [], nodeAspect = [], nodeCost = [];
        const nodesByHex = new Map();
        for (const hex of this.grid.getAllHexes()) {
            if (hex.state === 'inactive') continue;
            const key = `${hex.q},${hex.r}`;
            const ids = [];
            const fixed = endpointAspect.get(key);
            const choices = fixed !== undefined ? [fixed] : usable;
            for (const a of choices) {
                ids.push(nodeAspect.length);
                nodeQ.push(hex.q);
                nodeR.push(hex.r);
                nodeAspect.push(a);
                nodeCost.push(fixed !== undefined ? 0 : this.graph.getCost(a) + Math.random() * TIE_NOISE);
            }
            nodesByHex.set(key, ids);
        }
        const V = nodeAspect.length;

        // Edges, stored compactly (CSR).
        const adjStart = new Int32Array(V + 1);
        const adjList = [];
        for (let v = 0; v < V; v++) {
            adjStart[v] = adjList.length;
            const canLink = links.get(nodeAspect[v]);
            for (const n of this.grid.getNeighbors(nodeQ[v], nodeR[v])) {
                const ids = nodesByHex.get(`${n.q},${n.r}`);
                if (!ids) continue; // gap
                for (const u of ids) if (canLink.has(nodeAspect[u])) adjList.push(u);
            }
        }
        adjStart[V] = adjList.length;

        return {
            V, nodeQ, nodeR, nodeAspect,
            cost: Float64Array.from(nodeCost),
            adjStart, adj: Int32Array.from(adjList),
            terminals: endpoints.map(e => nodesByHex.get(`${e.q},${e.r}`)[0]),
        };
    }

    // Dreyfus-Wagner rooted at the last endpoint, never using the `banned` nodes.
    // Returns { cost, nodes: Set of node ids } or null when no tree exists.
    runDP(model, banned) {
        const { V, cost, adjStart, adj, terminals } = model;
        const isBanned = new Uint8Array(V);
        for (const v of banned) isBanned[v] = 1;

        const root = terminals[terminals.length - 1];
        const m = terminals.length - 1;
        const M = 1 << m;
        const dp = new Float64Array(M * V).fill(Infinity);
        // back[S*V+v]: 0 = endpoint leaf, >0 = reached from node (back-1) along an edge,
        //              <0 = two subtrees for submasks (-back) and S^(-back) meeting at v
        const back = new Int32Array(M * V);
        for (let i = 0; i < m; i++) dp[(1 << i) * V + terminals[i]] = 0;

        const heap = new MinHeap();
        for (let S = 1; S < M; S++) {
            const base = S * V;
            const lowBit = S & -S;

            // 1) Merge: two trees covering complementary subsets that share node v.
            for (let sub = (S - 1) & S; sub > 0; sub = (sub - 1) & S) {
                if (!(sub & lowBit)) continue; // visit each unordered split once
                const subBase = sub * V, restBase = (S ^ sub) * V;
                for (let v = 0; v < V; v++) {
                    const a = dp[subBase + v];
                    if (a === Infinity) continue;
                    const b = dp[restBase + v];
                    if (b === Infinity) continue;
                    const c = a + b - cost[v]; // v counted once
                    if (c < dp[base + v]) {
                        dp[base + v] = c;
                        back[base + v] = -sub;
                    }
                }
            }

            // 2) Grow: Dijkstra along edges; stepping onto node u costs cost[u].
            heap.clear();
            for (let v = 0; v < V; v++) if (dp[base + v] < Infinity) heap.push(dp[base + v], v);
            while (!heap.isEmpty()) {
                const d = heap.peekKey();
                const v = heap.pop();
                if (d > dp[base + v]) continue; // stale entry
                for (let e = adjStart[v]; e < adjStart[v + 1]; e++) {
                    const u = adj[e];
                    if (isBanned[u]) continue;
                    const c = d + cost[u];
                    if (c < dp[base + u]) {
                        dp[base + u] = c;
                        back[base + u] = v + 1;
                        heap.push(c, u);
                    }
                }
            }
        }

        const full = M - 1;
        const total = dp[full * V + root];
        if (total === Infinity) return null;

        const nodes = new Set();
        const stack = [[full, root]];
        while (stack.length > 0) {
            const [S, v] = stack.pop();
            nodes.add(v);
            const b = back[S * V + v];
            if (b > 0) {
                stack.push([S, b - 1]);
            } else if (b < 0) {
                stack.push([-b, v], [S ^ -b, v]);
            }
        }
        return { cost: total, nodes };
    }

    // Returns the node ids of the first hex that the tree uses with more than one aspect, or null.
    findConflict(model, nodes) {
        const byHex = new Map();
        for (const v of nodes) {
            const key = `${model.nodeQ[v]},${model.nodeR[v]}`;
            if (!byHex.has(key)) byHex.set(key, []);
            byHex.get(key).push(v);
        }
        for (const ids of byHex.values()) if (ids.length > 1) return ids;
        return null;
    }

    toPlacements(model, nodes) {
        return [...nodes].map(v => ({ q: model.nodeQ[v], r: model.nodeR[v], aspect: model.nodeAspect[v] }));
    }

    // Greedy solver, restarted from every endpoint (plus a few shuffled orders) within the time
    // budget; keeps the cheapest result.
    greedyFallback(endpoints) {
        this.lastMethod = 'greedy-fallback';
        const solver = new Solver(this.grid, this.graph);
        const deadline = performance.now() + this.fallbackBudgetMs;
        let best = null, bestCost = Infinity, runs = 0;
        for (let s = 0; s < endpoints.length; s++) {
            for (let rep = 0; rep < this.greedyRestartsPerEndpoint; rep++) {
                if (runs > 0 && performance.now() > deadline) return best;
                runs++;
                const others = endpoints.filter((_, i) => i !== s);
                for (let i = others.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [others[i], others[j]] = [others[j], others[i]];
                }
                const paths = solver.solve([endpoints[s], ...others]);
                if (!paths) continue;
                const c = this.placementCost(paths, endpoints);
                if (c < bestCost) {
                    bestCost = c;
                    best = paths;
                }
            }
        }
        return best;
    }

    placementCost(paths, endpoints) {
        const isEndpoint = new Set(endpoints.map(e => `${e.q},${e.r}`));
        const placed = new Map();
        for (const path of paths) {
            for (const n of path) {
                const key = `${n.q},${n.r}`;
                if (!isEndpoint.has(key)) placed.set(key, n.aspect);
            }
        }
        let total = 0;
        for (const aspect of placed.values()) total += this.graph.getCost(aspect);
        return total;
    }
}

// Binary min-heap of (key, value) pairs.
class MinHeap {
    constructor() {
        this.keys = [];
        this.vals = [];
    }

    clear() {
        this.keys.length = 0;
        this.vals.length = 0;
    }

    isEmpty() {
        return this.keys.length === 0;
    }

    peekKey() {
        return this.keys[0];
    }

    push(key, val) {
        const keys = this.keys, vals = this.vals;
        let i = keys.length;
        keys.push(key);
        vals.push(val);
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (keys[p] <= key) break;
            keys[i] = keys[p];
            vals[i] = vals[p];
            i = p;
        }
        keys[i] = key;
        vals[i] = val;
    }

    pop() {
        const keys = this.keys, vals = this.vals;
        const top = vals[0];
        const lastKey = keys.pop(), lastVal = vals.pop();
        const n = keys.length;
        if (n > 0) {
            let i = 0;
            for (;;) {
                const l = 2 * i + 1;
                if (l >= n) break;
                const r = l + 1;
                const c = r < n && keys[r] < keys[l] ? r : l;
                if (keys[c] >= lastKey) break;
                keys[i] = keys[c];
                vals[i] = vals[c];
                i = c;
            }
            keys[i] = lastKey;
            vals[i] = lastVal;
        }
        return top;
    }
}
