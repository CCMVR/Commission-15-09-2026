import { ELUS, STRUCTURES, COMMUNES_AVEC_STRUCTURES, isCommuneBlocked } from "./data.js?v=2.1";
import { supabaseClient } from "./supabase.js?v=2.1";

class CommissionApp {
    constructor() {
        this.elus = ELUS;
        this.structures = STRUCTURES;
        this.communes = COMMUNES_AVEC_STRUCTURES;
        this.inscriptions = [];
        this.searchQuery = "";
        this.selectedCommuneFilter = "all";
        this.repartitionViewMode = "structure";
        this.currentAllocation = null;
        this.pollingInterval = null;

        try {
            this.initElements();
            this.renderTableHeaders();
            this.renderTableBody();
            this.initQuickNavAndFilter();
            this.bindEvents();
            this.loadData();
        } catch (err) {
            console.error("Erreur initialisation CommissionApp:", err);
        }
    }

    initElements() {
        this.matrixHead = document.getElementById("matrixHead");
        this.matrixBody = document.getElementById("matrixBody");
        this.tableScrollContainer = document.getElementById("tableScrollContainer");
        this.syncBadge = document.getElementById("syncBadge");
        this.syncText = document.getElementById("syncText");
        this.searchInput = document.getElementById("searchInput");
        this.filterCommune = document.getElementById("filterCommune");
        this.quickNavPills = document.getElementById("quickNavPills");
        this.btnScrollLeft = document.getElementById("btnScrollLeft");
        this.btnScrollRight = document.getElementById("btnScrollRight");
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

        // Cadenas et Modal Répartition Coordinateur
        this.btnOpenRepartitionModal = document.getElementById("btnOpenRepartitionModal");
        this.repartitionModal = document.getElementById("repartitionModal");
        this.btnCloseRepartitionModal = document.getElementById("btnCloseRepartitionModal");
        this.btnDismissRepartitionModal = document.getElementById("btnDismissRepartitionModal");
        this.repartitionKpiBar = document.getElementById("repartitionKpiBar");
        this.repartitionContent = document.getElementById("repartitionContent");
        this.btnViewByStructure = document.getElementById("btnViewByStructure");
        this.btnViewByElu = document.getElementById("btnViewByElu");
        this.btnRecalculateRepartition = document.getElementById("btnRecalculateRepartition");
        this.btnExportRepartitionCsv = document.getElementById("btnExportRepartitionCsv");
        this.btnPrintRepartition = document.getElementById("btnPrintRepartition");

        // Compteurs stats
        this.statElusInscrits = document.getElementById("statElusInscrits");
        this.statTotalVoeux = document.getElementById("statTotalVoeux");
        this.statStructuresCouvertes = document.getElementById("statStructuresCouvertes");
    }

    initQuickNavAndFilter() {
        if (!this.filterCommune || !this.quickNavPills) return;

        // Remplir le select filter
        this.communes.forEach(c => {
            const count = this.structures.filter(s => s.commune === c).length;
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = `${c} (${count} structure${count > 1 ? 's' : ''})`;
            this.filterCommune.appendChild(opt);
        });

        // Remplir les pastilles de défilement rapide
        let pillsHtml = `<button class="quick-pill active" data-commune="all">Toutes (${this.structures.length})</button>`;
        this.communes.forEach(c => {
            const count = this.structures.filter(s => s.commune === c).length;
            pillsHtml += `<button class="quick-pill" data-commune="${this.escapeHtml(c)}">${this.escapeHtml(c)} (${count})</button>`;
        });
        this.quickNavPills.innerHTML = pillsHtml;

        this.quickNavPills.querySelectorAll(".quick-pill").forEach(pill => {
            pill.addEventListener("click", () => {
                const commune = pill.getAttribute("data-commune");
                if (this.selectedCommuneFilter !== "all" && this.selectedCommuneFilter !== commune) {
                    this.selectedCommuneFilter = "all";
                    this.filterCommune.value = "all";
                    this.renderTableHeaders();
                    this.renderTableBody();
                }

                if (commune === "all") {
                    this.tableScrollContainer.scrollTo({ left: 0, behavior: "smooth" });
                } else {
                    const targetTh = this.matrixHead.querySelector(`th[data-commune="${CSS.escape(commune)}"]`);
                    if (targetTh) {
                        const containerRect = this.tableScrollContainer.getBoundingClientRect();
                        const targetRect = targetTh.getBoundingClientRect();
                        const scrollOffset = targetRect.left - containerRect.left + this.tableScrollContainer.scrollLeft - 340;
                        this.tableScrollContainer.scrollTo({ left: Math.max(0, scrollOffset), behavior: "smooth" });
                    }
                }
                this.updateActivePill(commune);
            });
        });
    }

    updateActivePill(commune = this.selectedCommuneFilter) {
        if (!this.quickNavPills) return;
        this.quickNavPills.querySelectorAll(".quick-pill").forEach(p => {
            if (p.getAttribute("data-commune") === commune) {
                p.classList.add("active");
            } else {
                p.classList.remove("active");
            }
        });
    }

    bindEvents() {
        // Recherche
        if (this.searchInput) {
            this.searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderTableBody();
            });
        }

        // Filtre par commune
        if (this.filterCommune) {
            this.filterCommune.addEventListener("change", (e) => {
                this.selectedCommuneFilter = e.target.value;
                this.renderTableHeaders();
                this.renderTableBody();
                this.updateActivePill(this.selectedCommuneFilter);
            });
        }

        // Défilement boutons gauche/droite
        if (this.btnScrollLeft && this.tableScrollContainer) {
            this.btnScrollLeft.addEventListener("click", () => {
                this.tableScrollContainer.scrollBy({ left: -350, behavior: "smooth" });
            });
        }
        if (this.btnScrollRight && this.tableScrollContainer) {
            this.btnScrollRight.addEventListener("click", () => {
                this.tableScrollContainer.scrollBy({ left: 350, behavior: "smooth" });
            });
        }

        // Actualisation manuelle
        if (this.btnRefresh) {
            this.btnRefresh.addEventListener("click", () => {
                this.loadData(true);
            });
        }

        // Export CSV
        if (this.btnExportCsv) {
            this.btnExportCsv.addEventListener("click", () => {
                this.exportCsv();
            });
        }

        // Impression
        if (this.btnPrint) {
            this.btnPrint.addEventListener("click", () => {
                window.print();
            });
        }

        // Modal SQL (si présent)
        if (this.btnOpenSqlModal) {
            this.btnOpenSqlModal.addEventListener("click", () => this.openSqlModal());
        }
        if (this.btnCloseSqlModal) {
            this.btnCloseSqlModal.addEventListener("click", () => this.closeSqlModal());
        }
        if (this.btnDismissModal) {
            this.btnDismissModal.addEventListener("click", () => this.closeSqlModal());
        }
        if (this.btnCopySql) {
            this.btnCopySql.addEventListener("click", () => this.copySqlCode());
        }

        // Modal Répartition Coordinateur
        if (this.btnOpenRepartitionModal) {
            this.btnOpenRepartitionModal.addEventListener("click", () => this.openRepartitionModal());
        }
        if (this.btnCloseRepartitionModal) {
            this.btnCloseRepartitionModal.addEventListener("click", () => this.closeRepartitionModal());
        }
        if (this.btnDismissRepartitionModal) {
            this.btnDismissRepartitionModal.addEventListener("click", () => this.closeRepartitionModal());
        }
        if (this.btnViewByStructure) {
            this.btnViewByStructure.addEventListener("click", () => {
                this.repartitionViewMode = "structure";
                this.btnViewByStructure.classList.add("active");
                if (this.btnViewByElu) this.btnViewByElu.classList.remove("active");
                this.renderRepartitionContent();
            });
        }
        if (this.btnViewByElu) {
            this.btnViewByElu.addEventListener("click", () => {
                this.repartitionViewMode = "elu";
                this.btnViewByElu.classList.add("active");
                if (this.btnViewByStructure) this.btnViewByStructure.classList.remove("active");
                this.renderRepartitionContent();
            });
        }
        if (this.btnRecalculateRepartition) {
            this.btnRecalculateRepartition.addEventListener("click", () => {
                this.currentAllocation = this.computeOptimalAllocation();
                this.renderRepartitionModal();
                this.showToast("Attribution recalculée avec succès.", "success");
            });
        }
        if (this.btnExportRepartitionCsv) {
            this.btnExportRepartitionCsv.addEventListener("click", () => {
                this.exportRepartitionCsv();
            });
        }
        if (this.btnPrintRepartition) {
            this.btnPrintRepartition.addEventListener("click", () => {
                window.print();
            });
        }

        // Écoute des statuts de sync Supabase (silencieuse si badge absent)
        supabaseClient.onStatusChange((status, details) => {
            this.updateSyncBadge(status, details);
        });

        // Clic sur le badge si table manquante pour ouvrir le modal SQL
        if (this.syncBadge) {
            this.syncBadge.addEventListener("click", () => {
                if (this.syncBadge.classList.contains("table_missing")) {
                    this.openSqlModal();
                }
            });
        }
    }

    openRepartitionModal() {
        if (!this.repartitionModal) return;
        this.currentAllocation = this.computeOptimalAllocation();
        this.renderRepartitionModal();
        this.repartitionModal.style.display = "flex";
    }

    closeRepartitionModal() {
        if (!this.repartitionModal) return;
        this.repartitionModal.style.display = "none";
    }

    computeOptimalAllocation() {
        // Regrouper les inscriptions par élu
        const elusVotants = {};
        this.inscriptions.forEach(i => {
            if (!elusVotants[i.elu_nom]) {
                elusVotants[i.elu_nom] = {
                    elu_nom: i.elu_nom,
                    elu_commune: i.elu_commune,
                    choices: []
                };
            }
            elusVotants[i.elu_nom].choices.push({
                structure_nom: i.structure_nom,
                structure_commune: i.structure_commune,
                rang: i.choix_rang
            });
        });

        const voters = Object.values(elusVotants);
        voters.forEach(v => v.choices.sort((a, b) => a.rang - b.rang));

        if (voters.length === 0) {
            return {
                voters: [],
                assignment: {},
                structureAllocations: {},
                stats: {
                    totalVoters: 0,
                    rank1Count: 0,
                    rank2Count: 0,
                    rank3PlusCount: 0,
                    rank1Percent: 0,
                    rank2Percent: 0,
                    balancedStructures: 0
                }
            };
        }
        const MAX_PER_STRUCTURE = 3;

        const rankCost = (r) => {
            if (r === 1) return 0;
            if (r === 2) return 15;
            if (r === 3) return 35;
            if (r === 4) return 65;
            return 105;
        };

        const loadPenalty = (count, hadDemand) => {
            if (count === 0) return hadDemand ? 15 : 0;
            if (count === 1) return 5;
            if (count === 2 || count === 3) return 0; // Cible idéale : 2 à 3 élus
            // STRICT MAXIMUM DE 3 : Pénalité rédhibitoire pour tout dépassement de 3
            return 100000 * (count - 3);
        };

        const demandedStructures = new Set();
        voters.forEach(v => v.choices.forEach(c => demandedStructures.add(c.structure_nom)));

        // Tri des votants : ceux qui ont le moins de choix d'abord pour préserver leurs options
        const sortedVoters = [...voters].sort((a, b) => a.choices.length - b.choices.length);
        
        const assignment = {};
        const structureCounts = {};
        this.structures.forEach(s => structureCounts[s.name] = 0);

        // Phase 1 : Affectation initiale avec strict respect de la limite de 3 élus max
        sortedVoters.forEach(v => {
            let bestChoice = v.choices.find(c => (structureCounts[c.structure_nom] || 0) < MAX_PER_STRUCTURE);
            if (!bestChoice) {
                bestChoice = v.choices.reduce((minC, curC) => 
                    (structureCounts[curC.structure_nom] || 0) < (structureCounts[minC.structure_nom] || 0) ? curC : minC
                , v.choices[0]);
            }
            assignment[v.elu_nom] = bestChoice.structure_nom;
            structureCounts[bestChoice.structure_nom] = (structureCounts[bestChoice.structure_nom] || 0) + 1;
        });

        // Résolution proactive de tout dépassement (> 3) par réaffectation / chaînes de déplacement
        const resolveOvercapacity = () => {
            let changed = true;
            let guard = 0;
            while (changed && guard < 100) {
                changed = false;
                guard++;

                const overfull = this.structures.filter(s => (structureCounts[s.name] || 0) > MAX_PER_STRUCTURE);
                if (overfull.length === 0) break;

                for (const s of overfull) {
                    const elusInS = voters.filter(v => assignment[v.elu_nom] === s.name);
                    let moved = false;

                    // 1. Déplacement direct vers un choix alternatif avec < 3 élus
                    for (const v of elusInS) {
                        const altChoice = v.choices.find(c => c.structure_nom !== s.name && (structureCounts[c.structure_nom] || 0) < MAX_PER_STRUCTURE);
                        if (altChoice) {
                            assignment[v.elu_nom] = altChoice.structure_nom;
                            structureCounts[s.name]--;
                            structureCounts[altChoice.structure_nom] = (structureCounts[altChoice.structure_nom] || 0) + 1;
                            moved = true;
                            changed = true;
                            break;
                        }
                    }
                    if (moved) continue;

                    // 2. Déplacement en chaîne (2 sauts)
                    for (const v of elusInS) {
                        for (const c of v.choices) {
                            if (c.structure_nom === s.name) continue;
                            const intermediateStruct = c.structure_nom;
                            const elusInInter = voters.filter(v2 => assignment[v2.elu_nom] === intermediateStruct);
                            for (const v2 of elusInInter) {
                                const freeChoice = v2.choices.find(c2 => c2.structure_nom !== intermediateStruct && (structureCounts[c2.structure_nom] || 0) < MAX_PER_STRUCTURE);
                                if (freeChoice) {
                                    assignment[v2.elu_nom] = freeChoice.structure_nom;
                                    structureCounts[intermediateStruct]--;
                                    structureCounts[freeChoice.structure_nom] = (structureCounts[freeChoice.structure_nom] || 0) + 1;

                                    assignment[v.elu_nom] = intermediateStruct;
                                    structureCounts[s.name]--;
                                    structureCounts[intermediateStruct] = (structureCounts[intermediateStruct] || 0) + 1;

                                    moved = true;
                                    changed = true;
                                    break;
                                }
                            }
                            if (moved) break;
                        }
                        if (moved) break;
                    }
                }
            }
        };

        resolveOvercapacity();

        const calcTotalCost = () => {
            let cost = 0;
            voters.forEach(v => {
                const assignedStruct = assignment[v.elu_nom];
                const ch = v.choices.find(c => c.structure_nom === assignedStruct);
                cost += rankCost(ch ? ch.rang : 5);
            });
            this.structures.forEach(s => {
                cost += loadPenalty(structureCounts[s.name] || 0, demandedStructures.has(s.name));
            });
            return cost;
        };

        let currentCost = calcTotalCost();
        let improved = true;
        let iteration = 0;

        while (improved && iteration < 300) {
            improved = false;
            iteration++;

            // A. Déplacement individuel vers un autre choix (STRICTEMENT plafonné à 3 élus max)
            for (const v of voters) {
                const curStruct = assignment[v.elu_nom];
                for (const ch of v.choices) {
                    if (ch.structure_nom === curStruct) continue;
                    // Interdiction de déplacer un élu vers une structure ayant déjà 3 élus ou plus
                    if ((structureCounts[ch.structure_nom] || 0) >= MAX_PER_STRUCTURE) continue;

                    assignment[v.elu_nom] = ch.structure_nom;
                    structureCounts[curStruct]--;
                    structureCounts[ch.structure_nom] = (structureCounts[ch.structure_nom] || 0) + 1;

                    const newCost = calcTotalCost();
                    if (newCost < currentCost) {
                        currentCost = newCost;
                        improved = true;
                        break;
                    } else {
                        assignment[v.elu_nom] = curStruct;
                        structureCounts[curStruct]++;
                        structureCounts[ch.structure_nom]--;
                    }
                }
                if (improved) break;
            }

            if (improved) continue;

            // B. Échange (swap) entre 2 votants (conserve strictement les effectifs par structure)
            for (let i = 0; i < voters.length; i++) {
                for (let j = i + 1; j < voters.length; j++) {
                    const v1 = voters[i];
                    const v2 = voters[j];
                    const s1 = assignment[v1.elu_nom];
                    const s2 = assignment[v2.elu_nom];
                    if (s1 === s2) continue;

                    const v1CanTakeS2 = v1.choices.some(c => c.structure_nom === s2);
                    const v2CanTakeS1 = v2.choices.some(c => c.structure_nom === s1);

                    if (v1CanTakeS2 && v2CanTakeS1) {
                        assignment[v1.elu_nom] = s2;
                        assignment[v2.elu_nom] = s1;

                        const newCost = calcTotalCost();
                        if (newCost < currentCost) {
                            currentCost = newCost;
                            improved = true;
                            break;
                        } else {
                            assignment[v1.elu_nom] = s1;
                            assignment[v2.elu_nom] = s2;
                        }
                    }
                }
                if (improved) break;
            }
        }

        // Sécurité finale : s'assurer qu'aucun dépassement résiduel n'existe
        resolveOvercapacity();

        const structureAllocations = {};
        this.structures.forEach(s => {
            structureAllocations[s.name] = {
                structure: s,
                elus: []
            };
        });

        let rank1Count = 0;
        let rank2Count = 0;
        let rank3PlusCount = 0;

        voters.forEach(v => {
            const assignedStruct = assignment[v.elu_nom];
            const ch = v.choices.find(c => c.structure_nom === assignedStruct);
            const rang = ch ? ch.rang : 1;
            if (rang === 1) rank1Count++;
            else if (rang === 2) rank2Count++;
            else rank3PlusCount++;

            if (structureAllocations[assignedStruct]) {
                structureAllocations[assignedStruct].elus.push({
                    elu_nom: v.elu_nom,
                    elu_commune: v.elu_commune,
                    rang: rang,
                    allChoices: v.choices
                });
            }
        });

        let balancedCount = 0;
        this.structures.forEach(s => {
            const count = structureAllocations[s.name].elus.length;
            if (count >= 2 && count <= 3) balancedCount++;
        });

        return {
            voters,
            assignment,
            structureAllocations,
            stats: {
                totalVoters: voters.length,
                rank1Count,
                rank2Count,
                rank3PlusCount,
                rank1Percent: voters.length > 0 ? Math.round((rank1Count / voters.length) * 100) : 0,
                rank2Percent: voters.length > 0 ? Math.round((rank2Count / voters.length) * 100) : 0,
                balancedStructures: balancedCount
            }
        };
    }

    renderRepartitionModal() {
        if (!this.repartitionKpiBar || !this.repartitionContent) return;
        const res = this.currentAllocation || this.computeOptimalAllocation();
        this.currentAllocation = res;

        // KPI
        this.repartitionKpiBar.innerHTML = `
            <div class="repartition-kpi-item">
                <span class="repartition-kpi-label">Élus votants affectés</span>
                <span class="repartition-kpi-value">${res.stats.totalVoters} <span style="font-size:0.85rem; font-weight:normal; color:#64748b;">/ ${this.elus.length}</span></span>
            </div>
            <div class="repartition-kpi-item">
                <span class="repartition-kpi-label">Affectés sur Choix 1</span>
                <span class="repartition-kpi-value" style="color:#d97706;">${res.stats.rank1Count} <span style="font-size:0.85rem; font-weight:normal; color:#64748b;">(${res.stats.rank1Percent}%)</span></span>
            </div>
            <div class="repartition-kpi-item">
                <span class="repartition-kpi-label">Affectés sur Choix 2</span>
                <span class="repartition-kpi-value" style="color:#2563eb;">${res.stats.rank2Count} <span style="font-size:0.85rem; font-weight:normal; color:#64748b;">(${res.stats.rank2Percent}%)</span></span>
            </div>
            <div class="repartition-kpi-item">
                <span class="repartition-kpi-label">Structures à 2-3 élus (Idéal)</span>
                <span class="repartition-kpi-value" style="color:#059669;">${res.stats.balancedStructures} <span style="font-size:0.85rem; font-weight:normal; color:#64748b;">/ 20</span></span>
            </div>
        `;

        this.renderRepartitionContent();
    }

    renderRepartitionContent() {
        if (!this.repartitionContent) return;
        const res = this.currentAllocation;
        if (!res || res.voters.length === 0) {
            this.repartitionContent.innerHTML = `
                <div style="text-align:center; padding:3rem 1rem; color:#64748b;">
                    <div style="font-size:2.5rem; margin-bottom:0.75rem;">🗳️</div>
                    <h4 style="color:#1e293b; margin-bottom:0.35rem;">Aucun vœu enregistré pour le moment</h4>
                    <p style="font-size:0.875rem;">Dès que les élus exprimeront des choix dans la grille, l'attribution prévisionnelle apparaîtra automatiquement ici.</p>
                </div>`;
            return;
        }

        if (this.repartitionViewMode === "structure") {
            let html = `<div class="repartition-grid">`;
            this.structures.forEach(s => {
                const alloc = res.structureAllocations[s.name];
                const count = alloc ? alloc.elus.length : 0;

                let cardClass = "status-empty";
                let badgeClass = "rep-badge-empty";
                let badgeLabel = "0 élu positionné";

                if (count === 1) {
                    cardClass = "status-single";
                    badgeClass = "rep-badge-single";
                    badgeLabel = "1 élu référent";
                } else if (count === 2) {
                    cardClass = "status-ideal";
                    badgeClass = "rep-badge-ideal";
                    badgeLabel = `✅ 2 élus (Idéal)`;
                } else if (count === 3) {
                    cardClass = "status-ideal";
                    badgeClass = "rep-badge-ideal";
                    badgeLabel = `✅ 3 élus (Max)`;
                } else if (count > 3) {
                    cardClass = "status-over";
                    badgeClass = "rep-badge-over";
                    badgeLabel = `⚠️ ${count} élus (>3)`;
                }

                const serviceTags = s.services.map(srv => {
                    const cls = `tag-${srv.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "")}`;
                    const tooltip = srv === "DSP" ? 'title="Délégation de Service Public (seule DSP de la liste)"' : '';
                    return `<span class="service-tag ${cls}" ${tooltip}>${srv}</span>`;
                }).join("");

                html += `
                    <div class="repartition-card ${cardClass}">
                        <div class="rep-card-header">
                            <div>
                                <div class="rep-card-title">${this.escapeHtml(s.name)}</div>
                                <div class="rep-card-commune">📍 ${this.escapeHtml(s.commune)}</div>
                            </div>
                            <span class="rep-status-badge ${badgeClass}">${badgeLabel}</span>
                        </div>
                        <div class="rep-card-services">${serviceTags}</div>
                        <div class="rep-elus-list">`;

                if (count === 0) {
                    html += `<div class="rep-empty-msg">Aucun élu affecté sur cette structure</div>`;
                } else {
                    alloc.elus.forEach(e => {
                        html += `
                            <div class="rep-elu-item">
                                <span class="rep-elu-name">
                                    ${this.escapeHtml(e.elu_nom)}
                                    <span class="rep-elu-commune">(${this.escapeHtml(e.elu_commune)})</span>
                                </span>
                                <span class="choice-badge c${e.rang}">Choix ${e.rang}</span>
                            </div>`;
                    });
                }

                html += `</div></div>`;
            });
            html += `</div>`;
            this.repartitionContent.innerHTML = html;

        } else {
            // Vue par élu
            let html = `
                <table class="rep-elu-table">
                    <thead>
                        <tr>
                            <th>Élu(e) membre</th>
                            <th>Commune d'élection</th>
                            <th>Structure affectée</th>
                            <th>Commune structure</th>
                            <th>Vœu satisfait</th>
                            <th>Autres vœux exprimés</th>
                        </tr>
                    </thead>
                    <tbody>`;

            const sortedVoters = [...res.voters].sort((a, b) => a.elu_nom.localeCompare(b.elu_nom));
            sortedVoters.forEach(v => {
                const assignedStructName = res.assignment[v.elu_nom];
                const assignedStruct = this.structures.find(s => s.name === assignedStructName);
                const ch = v.choices.find(c => c.structure_nom === assignedStructName);
                const rang = ch ? ch.rang : 1;
                const otherChoices = v.choices
                    .filter(c => c.structure_nom !== assignedStructName)
                    .map(c => `${c.structure_nom} (C${c.rang})`)
                    .join(", ");

                html += `
                    <tr>
                        <td><strong>${this.escapeHtml(v.elu_nom)}</strong></td>
                        <td>${this.escapeHtml(v.elu_commune)}</td>
                        <td><strong>${this.escapeHtml(assignedStructName)}</strong></td>
                        <td>${this.escapeHtml(assignedStruct ? assignedStruct.commune : "")}</td>
                        <td><span class="choice-badge c${rang}">Choix ${rang}</span></td>
                        <td class="rep-other-choices">${otherChoices ? this.escapeHtml(otherChoices) : '<span style="opacity:0.5;">Aucun</span>'}</td>
                    </tr>`;
            });

            html += `</tbody></table>`;
            this.repartitionContent.innerHTML = html;
        }
    }

    exportRepartitionCsv() {
        const res = this.currentAllocation || this.computeOptimalAllocation();
        if (!res || res.voters.length === 0) {
            this.showToast("Aucun vœu à exporter pour le moment.", "warn");
            return;
        }

        let csvContent = "\uFEFF"; // BOM UTF-8
        csvContent += '"Structure";"Commune Structure";"Élu référent affecté";"Commune de l\'élu";"Vœu satisfait";"Date extraction"\r\n';

        this.structures.forEach(s => {
            const alloc = res.structureAllocations[s.name];
            if (!alloc || alloc.elus.length === 0) {
                csvContent += `"${s.name}";"${s.commune}";"--- Aucun élu affecté ---";"";"";"${new Date().toLocaleString('fr-FR')}"\r\n`;
            } else {
                alloc.elus.forEach(e => {
                    csvContent += `"${s.name}";"${s.commune}";"${e.elu_nom}";"${e.elu_commune}";"Choix ${e.rang}";"${new Date().toLocaleString('fr-FR')}"\r\n`;
                });
            }
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `repartition_elus_structures_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showToast("Export CSV de la répartition généré avec succès.", "success");
    }

    updateSyncBadge(status, details) {
        if (!this.syncBadge || !this.syncText) return;
        this.syncBadge.className = `sync-badge ${status}`;
        this.syncText.textContent = "";
    }

    async loadData(isUserAction = false) {
        try {
            const data = await supabaseClient.fetchInscriptions();
            this.inscriptions = data || [];
            this.renderTableBody();
            this.updateStats();
            if (this.repartitionModal && this.repartitionModal.style.display !== "none") {
                this.currentAllocation = this.computeOptimalAllocation();
                this.renderRepartitionModal();
            }
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
                        if (this.repartitionModal && this.repartitionModal.style.display !== "none") {
                            this.currentAllocation = this.computeOptimalAllocation();
                            this.renderRepartitionModal();
                        }
                    }
                }
            }, 15000);
        }
    }

    renderTableHeaders() {
        const displayedCommunes = this.selectedCommuneFilter === "all"
            ? this.communes
            : this.communes.filter(c => c === this.selectedCommuneFilter);

        // Ligne 1 : Communes
        let tr1 = `<tr>
            <th class="col-sticky-1" rowspan="2">Élu(e) membre</th>
            <th class="col-sticky-2" rowspan="2">Commune d'élection</th>`;

        // Regroupement des structures par commune
        this.structuresParCommune = {};
        displayedCommunes.forEach(c => {
            this.structuresParCommune[c] = this.structures.filter(s => s.commune === c);
            const count = this.structuresParCommune[c].length;
            tr1 += `<th colspan="${count}" data-commune="${this.escapeHtml(c)}">${this.escapeHtml(c)} <span style="font-size:0.75rem; font-weight:normal; opacity:0.85;">(${count})</span></th>`;
        });
        tr1 += `</tr>`;

        // Ligne 2 : Structures individuelles avec badges de service
        let tr2 = `<tr>`;
        displayedCommunes.forEach(c => {
            const structs = this.structuresParCommune[c];
            structs.forEach(s => {
                const serviceTags = s.services.map(srv => {
                    const cls = `tag-${srv.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "")}`;
                    const tooltip = srv === "DSP" ? 'title="Délégation de Service Public (seule DSP de la liste)"' : '';
                    return `<span class="service-tag ${cls}" ${tooltip}>${srv}</span>`;
                }).join("");

                tr2 += `<th class="th-structure" data-structure-id="${s.id}">
                    <span class="structure-name">${this.escapeHtml(s.name)}</span>
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

        const displayedCommunes = this.selectedCommuneFilter === "all"
            ? this.communes
            : this.communes.filter(c => c === this.selectedCommuneFilter);

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
            displayedCommunes.forEach(c => {
                const structs = this.structuresParCommune[c] || [];
                structs.forEach(s => {
                    const blocked = isCommuneBlocked(elu.commune, s.commune);
                    const voeu = eluVoeux.find(v => v.structure_nom === s.name);

                    if (blocked) {
                        html += `<td class="matrix-cell cell-blocked" 
                                     data-elu="${this.escapeHtml(elu.name)}" 
                                     data-structure="${this.escapeHtml(s.name)}" 
                                     title="Commune d'élection (${this.escapeHtml(elu.commune)}) : non sélectionnable">
                            <span class="blocked-label">🔒 Inéligible</span>
                        </td>`;
                    } else if (voeu) {
                        const rang = voeu.choix_rang;
                        html += `<td class="matrix-cell cell-selected" 
                                     data-elu="${this.escapeHtml(elu.name)}" 
                                     data-structure="${this.escapeHtml(s.name)}" 
                                     title="Cliquez pour annuler ce vœu (Choix ${rang})">
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

        if (this.repartitionModal && this.repartitionModal.style.display !== "none") {
            this.currentAllocation = this.computeOptimalAllocation();
            this.renderRepartitionModal();
        }
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
