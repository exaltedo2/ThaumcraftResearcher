export const primalAspects = [
    { id: 'aer', name: 'Aer', isPrimal: true, tier: 1, color: '#ffff7e' },
    { id: 'terra', name: 'Terra', isPrimal: true, tier: 1, color: '#56c000' },
    { id: 'ignis', name: 'Ignis', isPrimal: true, tier: 1, color: '#ff5a01' },
    { id: 'aqua', name: 'Aqua', isPrimal: true, tier: 1, color: '#3cd4fc' },
    { id: 'ordo', name: 'Ordo', isPrimal: true, tier: 1, color: '#d5d4ec' },
    { id: 'perditio', name: 'Perditio', isPrimal: true, tier: 1, color: '#404040' },
];

export const standardCompounds = [
    { id: 'vacuos', name: 'Vacuos', components: ['aer', 'perditio'], color: '#888888' },
    { id: 'lux', name: 'Lux', components: ['aer', 'ignis'], color: '#ffffc0' },
    { id: 'motus', name: 'Motus', components: ['aer', 'ordo'], color: '#cdccf4' },
    { id: 'gelum', name: 'Gelum', components: ['ignis', 'perditio'], color: '#e1ffff' },
    { id: 'vitreus', name: 'Vitreus', components: ['terra', 'ordo'], color: '#80ffff' },
    { id: 'victus', name: 'Victus', components: ['aqua', 'terra'], color: '#de0005' },
    { id: 'venenum', name: 'Venenum', components: ['aqua', 'perditio'], color: '#89f000' },
    { id: 'potentia', name: 'Potentia', components: ['ordo', 'ignis'], color: '#c0ffff' },
    { id: 'permutatio', name: 'Permutatio', components: ['perditio', 'ordo'], color: '#578357' },
    
    { id: 'metallum', name: 'Metallum', components: ['terra', 'vitreus'], color: '#b5b5cd' },
    { id: 'mortuus', name: 'Mortuus', components: ['victus', 'perditio'], color: '#887788' },
    { id: 'fames', name: 'Fames', components: ['vacuos', 'victus'], color: '#9c0328' },
    { id: 'volatus', name: 'Volatus', components: ['aer', 'motus'], color: '#e7e7d7' },
    { id: 'tenebrae', name: 'Tenebrae', components: ['vacuos', 'lux'], color: '#222222' },
    { id: 'spiritus', name: 'Spiritus', components: ['victus', 'mortuus'], color: '#ebebfb' },
    { id: 'sano', name: 'Sano', components: ['victus', 'ordo'], color: '#ff9a9a' },
    { id: 'bestia', name: 'Bestia', components: ['motus', 'victus'], color: '#9f6409' },
    { id: 'corpus', name: 'Corpus', components: ['mortuus', 'bestia'], color: '#ee478d' },
    { id: 'herba', name: 'Herba', components: ['victus', 'terra'], color: '#01ac00' },
    { id: 'arbor', name: 'Arbor', components: ['aer', 'herba'], color: '#876531' },
    { id: 'machina', name: 'Machina', components: ['motus', 'instrumentum'], color: '#8080a0' },
    { id: 'alienis', name: 'Alienis', components: ['vacuos', 'tenebrae'], color: '#805080' },
    { id: 'cognitio', name: 'Cognitio', components: ['ignis', 'spiritus'], color: '#ffc241' },
    { id: 'sensus', name: 'Sensus', components: ['aer', 'spiritus'], color: '#c0ffc0' },
    { id: 'humanus', name: 'Humanus', components: ['bestia', 'cognitio'], color: '#ffd6a7' },
    { id: 'instrumentum', name: 'Instrumentum', components: ['humanus', 'ordo'], color: '#4040ee' },
    { id: 'lucrum', name: 'Lucrum', components: ['humanus', 'fames'], color: '#e6be44' },
    { id: 'messis', name: 'Messis', components: ['herba', 'humanus'], color: '#e1b371' },
    { id: 'perfodio', name: 'Perfodio', components: ['humanus', 'terra'], color: '#dcd2d8' },
    { id: 'fabrico', name: 'Fabrico', components: ['humanus', 'instrumentum'], color: '#809d80' },
    { id: 'pannus', name: 'Pannus', components: ['instrumentum', 'bestia'], color: '#eaeac2' },
    { id: 'tutamen', name: 'Tutamen', components: ['instrumentum', 'terra'], color: '#00c0c0' },
    { id: 'telum', name: 'Telum', components: ['instrumentum', 'ignis'], color: '#c05050' },
    { id: 'praecantatio', name: 'Praecantatio', components: ['vacuos', 'potentia'], color: '#9700c5' },
    { id: 'vitium', name: 'Vitium', components: ['praecantatio', 'perditio'], color: '#800080' },
    { id: 'auram', name: 'Auram', components: ['praecantatio', 'aer'], color: '#ffc0ff' },

    { id: 'vinculum', name: 'Vinculum', components: ['motus', 'perditio'], color: '#9a8080' },
    { id: 'limus', name: 'Limus', components: ['victus', 'aqua'], color: '#01f800' },

    { id: 'iter', name: 'Iter', components: ['motus', 'terra'], color: '#a0785a' },
    { id: 'exanimis', name: 'Exanimis', components: ['motus', 'mortuus'], color: '#8a8aa0' },
    { id: 'meto', name: 'Meto', components: ['instrumentum', 'messis'], color: '#d4a017' },
    { id: 'tempestas', name: 'Tempestas', components: ['aer', 'aqua'], color: '#7a8ca8' },

    { id: 'caelum', name: 'Caelum', components: ['vitreus', 'metallum'], color: '#5e74cf' },
    { id: 'tabernus', name: 'Tabernus', components: ['tutamen', 'iter'], color: '#4c8569' },
    { id: 'terminus', name: 'Terminus', components: ['lucrum', 'alienis'], color: '#b90000' },
];

export const modAspects = {
    gtnh: [
        { id: 'electrum', name: 'Electrum', components: ['potentia', 'machina'], color: '#e6e600' },
        { id: 'magneto', name: 'Magneto', components: ['metallum', 'iter'], color: '#c0c0c0' },
        { id: 'aequalitas', name: 'Aequalitas', components: ['cognitio', 'ordo'], color: '#eef0ea' },
        { id: 'vesania', name: 'Vesania', components: ['cognitio', 'vitium'], color: '#1b122c' },
        { id: 'primordium', name: 'Primordium', components: ['vacuos', 'motus'], color: '#f7f7db' },
        { id: 'astrum', name: 'Astrum', components: ['lux', 'primordium'], color: '#2d2c2b' },
        { id: 'gloria', name: 'Gloria', components: ['humanus', 'iter'], color: '#ffe980' },
        { id: 'nebrisum', name: 'Nebrisum', components: ['lucrum', 'perfodio'], color: '#d4af37' },
        { id: 'radio', name: 'Radio', components: ['potentia', 'lux'], color: '#40ff40' },
        { id: 'strontio', name: 'Strontio', components: ['perditio', 'cognitio'], color: '#ff4040' },
        { id: 'tempus', name: 'Tempus', components: ['vacuos', 'ordo'], color: '#d6b885' },
        { id: 'infernus', name: 'Infernus', components: ['ignis', 'praecantatio'], color: '#ff0000' },
        { id: 'luxuria', name: 'Luxuria', components: ['corpus', 'fames'], color: '#ffc0cb' },
        { id: 'desidia', name: 'Desidia', components: ['vinculum', 'spiritus'], color: '#666666' },
        { id: 'superbia', name: 'Superbia', components: ['volatus', 'vacuos'], color: '#9400d3' },
        { id: 'invidia', name: 'Invidia', components: ['sensus', 'fames'], color: '#00ff00' },
        { id: 'ira', name: 'Ira', components: ['telum', 'ignis'], color: '#8b0000' },
        { id: 'gula', name: 'Gula', components: ['fames', 'vacuos'], color: '#d2691e' }
    ]
};

export class AspectDatabase {
    constructor() {
        this.aspects = new Map();
        this.enabledAspects = new Set();
        this.useMoreAspects = new Set();
        this.loadBaseAspects();
    }

    loadBaseAspects() {
        primalAspects.forEach(a => this.addAspect(a.id, a.name, [], true, false, true, a.color));
        standardCompounds.forEach(a => this.addAspect(a.id, a.name, a.components, false, false, true, a.color));
        
        for (const [modName, aspects] of Object.entries(modAspects)) {
            aspects.forEach(a => {
                this.addAspect(a.id, a.name, a.components, false, true, false, a.color);
                this.aspects.get(a.id).modName = modName; 
            });
        }
    }

    addAspect(id, name, components = [], isPrimal = false, isMod = false, defaultEnabled = true, color = '#ffffff') {
        if (!this.aspects.has(id)) {
            this.aspects.set(id, { id, name, components, isPrimal, isMod, tier: 1, color });
            if (defaultEnabled) {
                this.enabledAspects.add(id);
            }
        }
    }

    toggleAspect(id, enabled) {
        if (enabled) {
            this.enabledAspects.add(id);
        } else {
            this.enabledAspects.delete(id);
        }
    }

    toggleUseMore(id, useMore) {
        if (useMore) {
            this.useMoreAspects.add(id);
        } else {
            this.useMoreAspects.delete(id);
        }
    }

    getEnabledAspects() {
        return Array.from(this.aspects.values()).filter(a => this.enabledAspects.has(a.id));
    }

    getAspect(id) {
        return this.aspects.get(id);
    }
}
