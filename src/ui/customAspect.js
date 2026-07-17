export class CustomAspectUI {
    constructor(db, aspectListUI) {
        this.db = db;
        this.aspectListUI = aspectListUI;
        this.form = document.getElementById('form-add-aspect');
        this.setup();
    }

    setup() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('custom-aspect-name');
            const parent1Input = document.getElementById('custom-aspect-parent1');
            const parent2Input = document.getElementById('custom-aspect-parent2');

            // Sanitize name to prevent XSS
            const name = nameInput.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const parent1 = parent1Input.value;
            const parent2 = parent2Input.value;

            if (!name || !parent1 || !parent2) {
                alert("Please fill all fields to add a custom aspect.");
                return;
            }

            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!id) {
                alert("Aspect name must contain at least one alphanumeric character.");
                return;
            }
            
            if (this.db.getAspect(id)) {
                alert("An aspect with this name already exists.");
                return;
            }

            this.db.addAspect(id, name, [parent1, parent2], false, false);
            
            const aspect = this.db.getAspect(id);
            aspect.modName = 'Custom Aspects';
            aspect.isCustom = true;
            
            // Give it a blended color based on parents if possible
            const p1Obj = this.db.getAspect(parent1);
            const p2Obj = this.db.getAspect(parent2);
            if (p1Obj && p2Obj && p1Obj.color && p2Obj.color) {
                // Simple hex blend (average)
                const c1 = parseInt(p1Obj.color.replace('#', ''), 16);
                const c2 = parseInt(p2Obj.color.replace('#', ''), 16);
                const r = Math.floor(((c1 >> 16) + (c2 >> 16)) / 2);
                const g = Math.floor((((c1 >> 8) & 0xff) + ((c2 >> 8) & 0xff)) / 2);
                const b = Math.floor(((c1 & 0xff) + (c2 & 0xff)) / 2);
                aspect.color = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            }

            this.aspectListUI.render(); // Re-render sidebar

            // Reset form
            nameInput.value = '';
            parent1Input.value = '';
            parent2Input.value = '';
        });
    }
}
