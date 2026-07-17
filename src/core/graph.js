export class AspectGraph {
    constructor(aspectDatabase) {
        this.db = aspectDatabase;
    }

    // Returns a list of aspect IDs that can connect to the given aspect ID
    getValidConnections(aspectId, forceAspects = []) {
        const connections = [];
        const enabledAspects = this.db.getEnabledAspects();
        
        // Combine enabled aspects with forced aspects (endpoints that might be disabled)
        const aspectsToCheck = new Map();
        enabledAspects.forEach(a => aspectsToCheck.set(a.id, a));
        forceAspects.forEach(aId => {
            if (!aspectsToCheck.has(aId)) {
                aspectsToCheck.set(aId, this.db.getAspect(aId));
            }
        });

        const targetAspect = this.db.getAspect(aspectId);

        if (!targetAspect) return connections;

        for (const aspect of aspectsToCheck.values()) {
            if (aspect.id === aspectId) continue;
            
            // Check if aspect is a parent of targetAspect
            if (targetAspect.components.includes(aspect.id)) {
                connections.push(aspect.id);
            }
            // Check if targetAspect is a parent of aspect
            else if (aspect.components.includes(targetAspect.id)) {
                connections.push(aspect.id);
            }
        }

        return connections;
    }

    getCost(aspectId) {
        if (this.db.useMoreAspects.has(aspectId)) {
            return 0.5;
        }
        return 1.0;
    }
}
