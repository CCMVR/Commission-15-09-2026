/**
 * Client Supabase PostgREST dédié à la gestion des inscriptions de la Commission
 */

const SUPABASE_CONFIG = {
    apiUrl: "https://bnloivgpihtsxydjkgyc.supabase.co/rest/v1",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubG9pdmdwaWh0c3h5ZGprZ3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDY4MjIsImV4cCI6MjA4Njk4MjgyMn0.U1p2xnYLprSO8-w-6mlG9BMO4_-A916XGmsKQ5WkdEg",
    tableName: "inscriptions_elus_commission_structures",
    localStorageKey: "commission_inscriptions_local_backup_2026"
};

class SupabaseService {
    constructor() {
        this.config = SUPABASE_CONFIG;
        this.isOnline = navigator.onLine;
        this.lastSyncStatus = "idle"; // "idle" | "syncing" | "synced" | "error" | "offline"
        this.statusListeners = [];

        window.addEventListener("online", () => this.handleNetworkChange(true));
        window.addEventListener("offline", () => this.handleNetworkChange(false));
    }

    onStatusChange(callback) {
        this.statusListeners.push(callback);
    }

    notifyStatus(status, details = "") {
        this.lastSyncStatus = status;
        this.statusListeners.forEach(cb => cb(status, details));
    }

    handleNetworkChange(isOnline) {
        this.isOnline = isOnline;
        this.notifyStatus(isOnline ? "synced" : "offline", isOnline ? "Connexion rétablie" : "Mode hors-ligne");
    }

    getHeaders(extraHeaders = {}) {
        return {
            "apikey": this.config.anonKey,
            "Authorization": `Bearer ${this.config.anonKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
            ...extraHeaders
        };
    }

    /**
     * Récupère la liste de tous les vœux enregistrés
     */
    async fetchInscriptions() {
        this.notifyStatus("syncing", "Chargement des inscriptions...");
        const url = `${this.config.apiUrl}/${this.config.tableName}?select=*&order=elu_nom.asc,choix_rang.asc`;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders({ "Accept": "application/json" })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // Si la table n'existe pas encore (code PGRST205)
                if (response.status === 404 || errorData.code === "PGRST205") {
                    this.notifyStatus("table_missing", "Table Supabase non créée");
                    return this.getLocalBackup();
                }
                throw new Error(`Erreur Supabase ${response.status}: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            this.setLocalBackup(data);
            this.notifyStatus("synced", `Synchronisé (${data.length} vœux)`);
            return data;
        } catch (error) {
            console.warn("Échec requête Supabase, bascule sur le stockage local :", error.message);
            this.notifyStatus("error", error.message);
            return this.getLocalBackup();
        }
    }

    /**
     * Enregistre un nouveau vœu
     */
    async addInscription(eluNom, eluCommune, structureNom, structureCommune, choixRang) {
        this.notifyStatus("syncing", "Sauvegarde du vœu...");
        const payload = {
            elu_nom: eluNom,
            elu_commune: eluCommune,
            structure_nom: structureNom,
            structure_commune: structureCommune,
            choix_rang: choixRang,
            updated_at: new Date().toISOString()
        };

        const url = `${this.config.apiUrl}/${this.config.tableName}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 404 || errorData.code === "PGRST205") {
                    this.notifyStatus("table_missing", "Table Supabase non créée (mode local)");
                    return this.addLocalInscription(payload);
                }
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            const inserted = await response.json();
            this.notifyStatus("synced", "Vœu enregistré");
            return inserted[0] || payload;
        } catch (error) {
            console.warn("Erreur d'ajout distant, enregistrement local :", error.message);
            this.notifyStatus("error", "Sauvegardé en local (erreur serveur)");
            return this.addLocalInscription(payload);
        }
    }

    /**
     * Supprime un vœu
     */
    async deleteInscription(eluNom, structureNom) {
        this.notifyStatus("syncing", "Suppression du vœu...");
        const url = `${this.config.apiUrl}/${this.config.tableName}?elu_nom=eq.${encodeURIComponent(eluNom)}&structure_nom=eq.${encodeURIComponent(structureNom)}`;

        try {
            const response = await fetch(url, {
                method: "DELETE",
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 404 || errorData.code === "PGRST205") {
                    this.deleteLocalInscription(eluNom, structureNom);
                    return true;
                }
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            this.deleteLocalInscription(eluNom, structureNom);
            this.notifyStatus("synced", "Vœu supprimé");
            return true;
        } catch (error) {
            console.warn("Erreur de suppression distante, suppression locale :", error.message);
            this.deleteLocalInscription(eluNom, structureNom);
            this.notifyStatus("error", "Supprimé en local");
            return true;
        }
    }

    /**
     * Met à jour le rang d'un vœu existant
     */
    async updateChoixRang(id, newRang) {
        if (!id) return;
        const url = `${this.config.apiUrl}/${this.config.tableName}?id=eq.${id}`;
        try {
            await fetch(url, {
                method: "PATCH",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    choix_rang: newRang,
                    updated_at: new Date().toISOString()
                })
            });
        } catch (e) {
            console.warn("Erreur mise à jour rang distant :", e);
        }
    }

    // Gestion du stockage local (Offline / Fallback)
    getLocalBackup() {
        try {
            const raw = localStorage.getItem(this.config.localStorageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    setLocalBackup(data) {
        try {
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(data));
        } catch (e) {
            console.warn("Erreur écriture localStorage :", e);
        }
    }

    addLocalInscription(item) {
        const local = this.getLocalBackup();
        const existingIdx = local.findIndex(i => i.elu_nom === item.elu_nom && i.structure_nom === item.structure_nom);
        const record = { id: item.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...item };
        if (existingIdx >= 0) {
            local[existingIdx] = record;
        } else {
            local.push(record);
        }
        this.setLocalBackup(local);
        return record;
    }

    deleteLocalInscription(eluNom, structureNom) {
        const local = this.getLocalBackup().filter(i => !(i.elu_nom === eluNom && i.structure_nom === structureNom));
        this.setLocalBackup(local);
    }
}

export const supabaseClient = new SupabaseService();
