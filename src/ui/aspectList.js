import { modAspects } from '../data/aspects.js';

export class AspectListUI {
    constructor(db, containerId, onAspectSelected = null) {
        this.db = db;
        this.container = document.getElementById(containerId);
        this.onAspectSelected = onAspectSelected;
        this.searchQuery = '';
        this.currentEditAspectId = null;
        this.selectedAspectId = null;
        this.setupModToggles();
        this.setupSearch();
        this.setupModal();
        this.render();
    }

    setupModal() {
        const modal = document.getElementById('edit-formula-modal');
        const cancelBtn = document.getElementById('cancel-formula-btn');
        const saveBtn = document.getElementById('save-formula-btn');

        if (!modal) return;

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            this.currentEditAspectId = null;
        });

        saveBtn.addEventListener('click', () => {
            if (!this.currentEditAspectId) return;
            const p1 = document.getElementById('edit-formula-parent1').value;
            const p2 = document.getElementById('edit-formula-parent2').value;
            
            if (p1 && p2) {
                const aspect = this.db.getAspect(this.currentEditAspectId);
                if (aspect) {
                    aspect.components = [p1, p2];
                    this.render();
                }
            }
            modal.style.display = 'none';
            this.currentEditAspectId = null;
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('aspect-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.render();
            });
        }
    }

    setupModToggles() {
        const gregtech = document.getElementById('mod-gregtech');
        const gt_plus_plus = document.getElementById('mod-gt_plus_plus');
        const magicbees = document.getElementById('mod-magicbees');
        const forbiddenmagic = document.getElementById('mod-forbiddenmagic');

        gregtech.addEventListener('change', (e) => {
            this.toggleMod('gregtech', e.target.checked);
        });

        gt_plus_plus.addEventListener('change', (e) => {
            this.toggleMod('gt_plus_plus', e.target.checked);
        });

        magicbees.addEventListener('change', (e) => {
            this.toggleMod('magicbees', e.target.checked);
        });

        forbiddenmagic.addEventListener('change', (e) => {
            this.toggleMod('forbiddenmagic', e.target.checked);
        });
    }

    toggleMod(modName, isEnabled) {
        const aspects = modAspects[modName];
        if (aspects) {
            aspects.forEach(a => {
                this.db.toggleAspect(a.id, isEnabled);
            });
        }
        this.render();
    }

    checkModStates() {
        // Sync the mod checkboxes based on the individual aspects
        const mods = ['gregtech', 'gt_plus_plus', 'magicbees', 'forbiddenmagic'];
        mods.forEach(modName => {
            const cb = document.getElementById(`mod-${modName}`);
            if (!cb) return;

            const aspects = modAspects[modName];
            if (!aspects || aspects.length === 0) return;

            // Are ALL aspects of this mod enabled?
            const allEnabled = aspects.every(a => this.db.enabledAspects.has(a.id));
            cb.checked = allEnabled;
        });
    }

    openEditModal(aspect) {
        this.currentEditAspectId = aspect.id;
        const modal = document.getElementById('edit-formula-modal');
        const nameSpan = document.getElementById('edit-formula-aspect-name');
        const p1Select = document.getElementById('edit-formula-parent1');
        const p2Select = document.getElementById('edit-formula-parent2');

        nameSpan.textContent = aspect.name;
        
        p1Select.innerHTML = '';
        p2Select.innerHTML = '';
        
        const allAspects = Array.from(this.db.aspects.values())
            .sort((a, b) => a.name.localeCompare(b.name));

        allAspects.forEach(a => {
            if (a.id === aspect.id) return;
            const opt1 = document.createElement('option');
            opt1.value = a.id;
            opt1.textContent = a.name;
            if (aspect.components[0] === a.id) opt1.selected = true;
            p1Select.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = a.id;
            opt2.textContent = a.name;
            if (aspect.components[1] === a.id) opt2.selected = true;
            p2Select.appendChild(opt2);
        });

        modal.style.display = 'flex';
    }

    render() {
        this.checkModStates();
        this.container.innerHTML = '';
        const aspects = Array.from(this.db.aspects.values()).filter(a => {
            if (!this.searchQuery) return true;
            return a.name.toLowerCase().includes(this.searchQuery) || a.id.toLowerCase().includes(this.searchQuery);
        });

        // Group aspects into categories
        const categories = {
            'Primals': [],
            'Base Game': [],
            'gregtech': [],
            'gt_plus_plus': [],
            'magicbees': [],
            'forbiddenmagic': [],
            'Custom Aspects': []
        };

        aspects.forEach(a => {
            if (a.isPrimal) {
                categories['Primals'].push(a);
            } else if (a.isCustom) {
                categories['Custom Aspects'].push(a);
            } else if (!a.modName) {
                categories['Base Game'].push(a);
            } else {
                categories[a.modName].push(a);
            }
        });

        // Sort within categories alphabetically
        Object.values(categories).forEach(list => {
            list.sort((a, b) => a.name.localeCompare(b.name));
        });

        const renderGroup = (title, list) => {
            if (list.length === 0) return;
            
            const header = document.createElement('h4');
            header.className = 'aspect-category-header';
            header.innerText = title;
            header.style.marginTop = '15px';
            header.style.marginBottom = '5px';
            header.style.color = 'var(--primary-color)';
            header.style.borderBottom = '1px solid var(--panel-border)';
            this.container.appendChild(header);

            list.forEach(aspect => {
                const item = document.createElement('div');
                item.className = 'aspect-item aspect-draggable';
                if (this.selectedAspectId === aspect.id) {
                    item.classList.add('selected');
                }
                item.setAttribute('draggable', 'true');
                item.dataset.id = aspect.id;

                const isEnabled = this.db.enabledAspects.has(aspect.id);
                const isUseMore = this.db.useMoreAspects.has(aspect.id);

                const imageUrl = aspect.isCustom ? '' : `./assets/aspects/${aspect.id}.png?v=7`;
                const iconHtml = aspect.isCustom 
                    ? `<div class="aspect-icon" style="background-color: ${aspect.color}; border-radius: 50%; width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.3);"></div>`
                    : `<div class="aspect-icon color-mask" style="-webkit-mask-image: url('${imageUrl}'); mask-image: url('${imageUrl}'); background-color: ${aspect.color};"></div>`;

                item.innerHTML = `
                    <div class="aspect-item-header">
                        <input type="checkbox" class="aspect-enable" data-id="${aspect.id}" ${isEnabled ? 'checked' : ''} title="Enable/Disable">
                        <div class="aspect-title ${aspect.isPrimal ? 'aspect-tier-primal' : 'aspect-tier-compound'}">
                            ${iconHtml}
                            <span>${aspect.name}</span>
                        </div>
                        ${aspect.isCustom ? `<button class="delete-custom-btn" data-id="${aspect.id}" title="Delete Custom Aspect" style="background:transparent;border:none;cursor:pointer;color:red;font-size:1.1rem;opacity:0.7;">🗑️</button>` : ''}
                        ${!aspect.isPrimal ? `<button class="edit-formula-btn" data-id="${aspect.id}" title="Edit Formula">⚙️</button>` : ''}
                    </div>
                    <div class="aspect-item-controls">
                        <label title="Prefer using this aspect when solving">
                            <input type="checkbox" class="aspect-use-more" data-id="${aspect.id}" ${isUseMore ? 'checked' : ''}> Use More
                        </label>
                        <span class="aspect-formula" id="formula-${aspect.id}">
                            ${aspect.components.length > 0 ? `(${aspect.components[0]} + ${aspect.components[1]})` : '(Primal)'}
                        </span>
                    </div>
                `;

                this.container.appendChild(item);

                // Select aspect on click (for mobile tap-to-place)
                item.addEventListener('click', (e) => {
                    // Ignore clicks on buttons/checkboxes
                    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') return;
                    
                    this.selectedAspectId = aspect.id;
                    this.render(); // Re-render to show selected state
                    if (this.onAspectSelected) {
                        this.onAspectSelected(aspect.id);
                    }
                });

                // Drag event
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', aspect.id);
                    e.dataTransfer.effectAllowed = 'copy';
                });

                // Checkbox events
                const enableCb = item.querySelector('.aspect-enable');
                enableCb.addEventListener('change', (e) => {
                    this.db.toggleAspect(aspect.id, e.target.checked);
                    this.checkModStates(); // Update mod checkboxes
                });

                const useMoreCb = item.querySelector('.aspect-use-more');
                useMoreCb.addEventListener('change', (e) => {
                    this.db.toggleUseMore(aspect.id, e.target.checked);
                });

                // Delete custom aspect
                const delBtn = item.querySelector('.delete-custom-btn');
                if (delBtn) {
                    delBtn.addEventListener('click', () => {
                        if (confirm(`Are you sure you want to delete the custom aspect "${aspect.name}"?`)) {
                            this.db.aspects.delete(aspect.id);
                            this.db.enabledAspects.delete(aspect.id);
                            this.db.useMoreAspects.delete(aspect.id);
                            this.render();
                        }
                    });
                }

                // Edit formula
                const editBtn = item.querySelector('.edit-formula-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', () => {
                        this.openEditModal(aspect);
                    });
                }

                // Tooltip
                item.addEventListener('mouseenter', (e) => {
                    const tooltip = document.getElementById('aspect-tooltip');
                    if (!tooltip) return;
                    
                    let html = '';
                    if (aspect.isPrimal) {
                        html = `<span>${aspect.name} (Primal)</span>`;
                    } else {
                        const p1 = this.db.getAspect(aspect.components[0]);
                        const p2 = this.db.getAspect(aspect.components[1]);
                        
                        const renderIcon = (a) => {
                            if (!a) return `<span>?</span>`;
                            if (a.isCustom) {
                                return `<div class="aspect-icon" style="background-color: ${a.color}; border-radius: 50%; width: 24px; height: 24px; display: inline-block; vertical-align: middle; border: 2px solid rgba(255,255,255,0.3);"></div>`;
                            }
                            const url = `./assets/aspects/${a.id}.png?v=7`;
                            return `<div class="color-mask" style="-webkit-mask-image: url('${url}'); mask-image: url('${url}'); background-color: ${a.color}; width: 24px; height: 24px; display: inline-block; vertical-align: middle;"></div>`;
                        };
                        
                        html = `
                            ${renderIcon(p1)} <span>+</span> ${renderIcon(p2)} <span>=</span>
                            ${renderIcon(aspect)} <span>${aspect.name}</span>
                        `;
                    }
                    
                    tooltip.innerHTML = html;
                    tooltip.style.display = 'flex';
                });

                item.addEventListener('mousemove', (e) => {
                    const tooltip = document.getElementById('aspect-tooltip');
                    if (tooltip && tooltip.style.display !== 'none') {
                        tooltip.style.left = (e.clientX + 15) + 'px';
                        tooltip.style.top = (e.clientY + 15) + 'px';
                    }
                });

                item.addEventListener('mouseleave', () => {
                    const tooltip = document.getElementById('aspect-tooltip');
                    if (tooltip) tooltip.style.display = 'none';
                });
            });
        };

        renderGroup('Primals', categories['Primals']);
        renderGroup('Base Game', categories['Base Game']);
        renderGroup('GregTech', categories['gregtech']);
        renderGroup('GT++', categories['gt_plus_plus']);
        renderGroup('MagicBees', categories['magicbees']);
        renderGroup('Forbidden Magic', categories['forbiddenmagic']);
        renderGroup('Custom Aspects', categories['Custom Aspects']);

        // Update custom aspect form dropdowns
        this.updateCustomDropdowns();

        // Save state on any change that triggers a re-render
        if (window.saveAppConfig) window.saveAppConfig();
    }

    updateCustomDropdowns() {
        const p1 = document.getElementById('custom-aspect-parent1');
        const p2 = document.getElementById('custom-aspect-parent2');
        if (!p1 || !p2) return;

        const options = Array.from(this.db.aspects.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(a => `<option value="${a.id}">${a.name}</option>`)
            .join('');

        p1.innerHTML = `<option value="">Parent 1</option>${options}`;
        p2.innerHTML = `<option value="">Parent 2</option>${options}`;
    }
}
