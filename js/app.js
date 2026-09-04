import { ELUS, STRUCTURES, COMMUNES_AVEC_STRUCTURES, isCommuneBlocked } from "./data.js";
import { supabaseClient } from "./supabase.js";

class CommissionApp {
    constructor() {
        this.elus = ELUS;
        this.structures = STRUCTURES;
        this.communes = COMMUNES_AVEC_STRUCTURES;
        this.inscriptions = [];
        this.searchQuery = "";
        this.pollingInterval = null;

        this.initElements();
        this.bindEvents();
        this.renderTableHeaders();
        this.loadData();
    }

    initElements() {
        this.matrixHead = document.getElementById("matrixHead");
        this.matrixBody = document.getElementById("matrixBody");
        this.syncBadge = document.getElementById("syncBadge");
        this.syncText = document.getElementById("syncText");
        this.searchInput = document.getElementById("searchInput");
        this.btnExportCsv = document.getElementById("btnExportCsv");
        this.btnPrint = document.getElementById("btnPrint");
        this.btnRefresh = document.getElementById("btnRefresh");
        this.sqlModal = document.getElementById("sqlModal");
        this.btnOpenSqlModal = document.getElementById("btnOpenSqlModal");
        this.btnCloseSqlModal = document.getElementById("btnCloseSqlModal");
        this.btnDismissModal = document.getElementById("btnDismissModal");
        this.btnCopySql = document.getElementById("btnCopySql");
        this.sqlCodeBlock = document.getElementById("sqlCodeBlock");
        this.toastContainer = document.getElementById("toastContainer");

        // Compteurs stats
        this.statElusInscrits = document.getElementById("statElusInscrits");
        this.statTotalVoeux = document.getElementById("statTotalVoeux");
        this.statStructuresCouvertes = document.getElementById("statStructuresCouvertes");
    }

    bindEvents() {
        // Recherche
        this.searchInput.addEventListener("input", (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.renderTableBody();
        });

        // Actualisation manuelle
        this.btnRefresh.addEventListener("click", () => {
            this.loadData(true);
        });

        // Export CSV
        this.btnExportCsv.addEventListener("click", () => {
            this.exportCsv();
        });

        // Impression
        this.btnPrint.addEventListener("click", () => {
            window.print();
        });

        // Modal SQL
        this.btnOpenSqlModal.addEventListener("click", () => this.openSqlModal());
        this.btnCloseSqlModal.addEventListener("click", () => this.closeSqlModal());
        this.btnDismissModal.addEventListener("click", () => this.closeSqlModal());
        this.btnCopySql.addEventListener("click", () => this.copySqlCode());

        // Écoute des statuts de sync Supabase
        supabaseClient.onStatusChange((status, details) => {
            this.updateSyncBadge(status, details);
        });

        // Clic sur le badge si table manquante pour ouvrir le modal SQL
        this.syncBadge.addEventListener("click", () => {
            if (this.syncBadge.classList.contains("table_missing")) {
                this.openSqlModal();
            }
        });
    }

    updateSyncBadge(status, details) {
        this.syncBadge.className = `sync-badge ${status}`;
        if (status === "synced") {
            this.syncText.textContent = "Connecté & Synchronisé";
            this.syncBadge.title = details;
        } else if (status === "syncing") {
            this.syncText.textContent = details || "Synchronisation...";
        } else if (status === "table_missing") {
            this.syncText.textContent = "Table Supabase à créer (cliquez ici)";
            this.syncBadge.title = "Cliquez pour afficher le script SQL à exécuter dans Supabase";
        } else if (status === "offline") {
            this.syncText.textContent = "Mode hors-ligne (local)";
        } else {
            this.syncText.textContent = "Mode local / Sauvegardé";
            this.syncBadge.title = details;
        }
    }

    async loadData(isUserAction = false) {
        try {
            const data = await supabaseClient.fetchInscriptions();
            this.inscriptions = data || [];
            this.renderTableBody();
            this.updateStats();
            if (isUserAction) {
                this.showToast("Données actualisées avec succès.", "success");
            }
        } catch (error) {
            console.error("Erreur chargement :", error);
        }

        // Lancement du polling (toutes les 15s) pour synchro multi-utilisateurs en réunion
        if (!this.pollingInterval) {
            this.pollingInterval = setInterval(async () => {
                if (document.visibilityState === "visible") {
                    const data = await supabaseClient.fetchInscriptions();
                    if (data && JSON.stringify(data) !== JSON.stringify(this.inscriptions)) {
                        this.inscriptions = data;
                        this.renderTableBody();
                        this.updateStats();
                    }
                }
            }, 15000);
        }
    }

    renderTableHeaders() {
        // Ligne 1 : Communes
        let tr1 = `<tr>
            <th class="col-sticky-1" rowspan="2">Élu(e) membre</th>
            <th class="col-sticky-2" rowspan="2">Commune d'élection</th>`;

        // Regroupement des structures par commune
        this.structuresParCommune = {};
        this.communes.forEach(c => {
            this.structuresParCommune[c] = this.structures.filter(s => s.commune === c);
            const count = this.structuresParCommune[c].length;
            tr1 += `<th colspan="${count}">${c} <span style="font-size:0.75rem; font-weight:normal; opacity:0.85;">(${count})</span></th>`;
        });
        tr1 += `</tr>`;

        // Ligne 2 : Structures individuelles avec badges de service
        let tr2 = `<tr>`;
        this.communes.forEach(c => {
            const structs = this.structuresParCommune[c];
            structs.forEach(s => {
                const serviceTags = s.services.map(srv => {
                    const cls = `tag-${srv.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "")}`;
                    return `<span class="service-tag ${cls}">${srv}</span>`;
                }).join("");

                tr2 += `<th class="th-structure" data-structure-id="${s.id}">
                    <span class="structure-name">${s.name}</span>
                    <div class="structure-badge-group">${serviceTags}</div>
                </th>`;
            });
        });
        tr2 += `</tr>`;

        this.matrixHead.innerHTML = tr1 + tr2;
    }

    renderTableBody() {
        const filteredElus = this.elus.filter(elu => {
            if (!this.searchQuery) return true;
            return elu.name.toLowerCase().includes(this.searchQuery) ||
                   elu.commune.toLowerCase().includes(this.searchQuery);
        });

        if (filteredElus.length === 0) {
            this.matrixBody.innerHTML = `<tr><td colspan="50" style="padding:2rem; text-align:center; color:#64748b;">
                Aucun élu ne correspond à votre recherche "<em>${this.escapeHtml(this.searchQuery)}</em>".
            </td></tr>`;
            return;
        }

        let html = "";
        filteredElus.forEach(elu => {
            const eluVoeux = this.inscriptions.filter(i => i.elu_nom === elu.name);
            const isPresidente = elu.role && elu.role.includes("Présidente");

            html += `<tr data-elu-name="${this.escapeHtml(elu.name)}">`;
            
            // Colonne 1 : Nom de l'élu
            html += `<td class="col-sticky-1">
                <div>${this.escapeHtml(elu.name)}</div>
                ${isPresidente ? `<div style="font-size:0.72rem; color:#1e3a8a; font-weight:700;">Présidente de la CC</div>` : ""}
            </td>`;

            // Colonne 2 : Commune de rattachement
            html += `<td class="col-sticky-2">
                ${this.escapeHtml(elu.commune)}
            </td>`;

            // Colonnes structures
            this.communes.forEach(c => {
                const structs = this.structuresParCommune[c];
                structs.forEach(s => {
                    const blocked = isCommuneBlocked(elu.commune, s.commune);
                    const voeu = eluVoeux.find(v => v.structure_nom === s.name);

                    if (blocked) {
                        html += `<td class="matrix-cell cell-blocked" 
                                     data-elu="${this.escapeHtml(elu.name)}" 
                                     data-structure="${this.escapeHtml(s.name)}" 
                                     title="Commune de rattachement : non sélectionnable">
                            <span class="blocked-label">🔒 Origine</span>
                        </td>`;
                    } else if (voeu) {
                        const rang = voeu.choix_rang;
                        html += `<td class="matrix-cell cell-selected" 
                                     data-elu="${this.escapeHtml(elu.name)}" 
                                     data-structure="${this.escapeHtml(s.name)}" 
                                     title="Cliquez pour annuler ce vœu">
                            <span class="choice-badge c${rang}">Choix ${rang}</span>
                        </td>`;
                    } else {
                        html += `<td class="matrix-cell" 
                                     data-elu="${this.escapeHtml(elu.name)}" 
                                     data-structure="${this.escapeHtml(s.name)}" 
                                     title="Cliquez pour choisir cette structure">
                        </td>`;
                    }
                });
            });

            html += `</tr>`;
        });

        this.matrixBody.innerHTML = html;

        // Attachement des écouteurs de clics sur les cellules
        this.matrixBody.querySelectorAll(".matrix-cell").forEach(cell => {
            cell.addEventListener("click", (e) => {
                const eluName = cell.getAttribute("data-elu");
                const structureName = cell.getAttribute("data-structure");
                this.handleCellClick(eluName, structureName, cell);
            });
        });
    }

    async handleCellClick(eluName, structureName, cellElement) {
        const elu = this.elus.find(e => e.name === eluName);
        const structure = this.structures.find(s => s.name === structureName);
        if (!elu || !structure) return;

        // 1. Règle d'incompatibilité communale
        if (isCommuneBlocked(elu.commune, structure.commune)) {
            this.showToast(
                `Cette structure est située sur votre commune (${elu.commune}). Conformément à la règle de neutralité, vous ne pouvez pas la choisir.`,
                "warn"
            );
            return;
        }

        const eluVoeux = this.inscriptions
            .filter(i => i.elu_nom === elu.name)
            .sort((a, b) => a.choix_rang - b.choix_rang);

        const existingVoeu = eluVoeux.find(v => v.structure_nom === structure.name);

        // 2. Désélection d'un choix existant avec réindexation
        if (existingVoeu) {
            const rangSupprime = existingVoeu.choix_rang;

            // Retrait local immédiat (optimiste)
            this.inscriptions = this.inscriptions.filter(i => !(i.elu_nom === elu.name && i.structure_nom === structure.name));

            // Réindexation des choix supérieurs
            const voeuxRestants = this.inscriptions.filter(i => i.elu_nom === elu.name);
            const updatesToPersist = [];

            voeuxRestants.forEach(v => {
                if (v.choix_rang > rangSupprime) {
                    v.choix_rang -= 1;
                    updatesToPersist.push(v);
                }
            });

            this.renderTableBody();
            this.updateStats();

            this.showToast(`Vœu sur ${structure.name} annulé. Vos choix restants ont été réordonnés.`, "success");

            // Persistance Supabase
            await supabaseClient.deleteInscription(elu.name, structure.name);
            for (const v of updatesToPersist) {
                await supabaseClient.updateChoixRang(v.id, v.choix_rang);
            }
            return;
        }

        // 3. Ajout d'un nouveau choix (Plafond de 5 vœux max)
        if (eluVoeux.length >= 5) {
            this.showToast(
                `Plafond atteint : ${elu.name} a déjà formulé 5 vœux (maximum autorisé). Cliquez sur un vœu existant pour l'annuler avant d'en choisir un autre.`,
                "warn"
            );
            return;
        }

        const newRang = eluVoeux.length + 1;
        const newRecord = {
            id: `temp-${Date.now()}`,
            elu_nom: elu.name,
            elu_commune: elu.commune,
            structure_nom: structure.name,
            structure_commune: structure.commune,
            choix_rang: newRang,
            created_at: new Date().toISOString()
        };

        // Ajout local optimiste
        this.inscriptions.push(newRecord);
        this.renderTableBody();
        this.updateStats();

        this.showToast(`Choix ${newRang} attribué à ${structure.name} pour ${elu.name} !`, "success");

        // Envoi Supabase
        const saved = await supabaseClient.addInscription(
            elu.name,
            elu.commune,
            structure.name,
            structure.commune,
            newRang
        );
        if (saved && saved.id) {
            newRecord.id = saved.id;
        }
    }

    updateStats() {
        const uniqueElus = new Set(this.inscriptions.map(i => i.elu_nom));
        const uniqueStructures = new Set(this.inscriptions.map(i => i.structure_nom));

        this.statElusInscrits.textContent = `${uniqueElus.size} / ${this.elus.length}`;
        this.statTotalVoeux.textContent = this.inscriptions.length;
        this.statStructuresCouvertes.textContent = `${uniqueStructures.size} / ${this.structures.length}`;
    }

    exportCsv() {
        if (this.inscriptions.length === 0) {
            this.showToast("Aucun vœu enregistré pour le moment.", "warn");
            return;
        }

        // Tri par Élu puis par Rang de choix
        const sorted = [...this.inscriptions].sort((a, b) => {
            if (a.elu_nom !== b.elu_nom) return a.elu_nom.localeCompare(b.elu_nom);
            return a.choix_rang - b.choix_rang;
        });

        let csvContent = "\uFEFF"; // BOM pour prise en compte des accents dans Excel
        csvContent += "Élu;Commune de l'Élu;Rang Choix;Structure Retenue;Commune de la Structure;Date Enregistrement\r\n";

        sorted.forEach(row => {
            csvContent += `"${row.elu_nom}";"${row.elu_commune}";"Choix ${row.choix_rang}";"${row.structure_nom}";"${row.structure_commune}";"${row.created_at || ''}"\r\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inscriptions_commission_enfance_jeunesse_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast("Fichier CSV exporté avec succès.", "success");
    }

    openSqlModal() {
        this.sqlModal.style.display = "flex";
    }

    closeSqlModal() {
        this.sqlModal.style.display = "none";
    }

    copySqlCode() {
        const text = this.sqlCodeBlock.innerText;
        navigator.clipboard.writeText(text).then(() => {
            this.btnCopySql.textContent = "✓ Copié dans le presse-papier !";
            setTimeout(() => {
                this.btnCopySql.textContent = "Copier le script SQL";
            }, 2500);
            this.showToast("Script SQL copié dans le presse-papier !", "success");
        }).catch(err => {
            console.error("Échec copie :", err);
        });
    }

    showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${this.escapeHtml(message)}</span>`;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3800);
    }

    escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
    window.app = new CommissionApp();
});
