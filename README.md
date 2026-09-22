# Commission Enfance Jeunesse Solidarités
## Outil d'inscription et de positionnement des élus sur les structures du territoire pour y être élus référents

Application web interactive destinée aux membres élus de la commission Enfance Jeunesse Solidarités de la **Communauté de communes Marches du Velay Rochebaron**, pour leur permettre de se positionner et d'exprimer leurs vœux d'investissement sur les structures d'accueil du territoire pour y être élus référents.

---

## 🎯 Fonctionnalités clés

1. **Matrice interactive dynamique** :
   - Les 32 élus en ordonnée (à gauche avec leur commune d'appartenance).
   - Les 20 structures d'accueil en abscisse (colonnes), regroupées par commune d'implantation, avec le détail des services dispensés (ALSH, Ados, Crèche, RPE, Solidarités, Ludothèque).
   - En-têtes et colonnes de gauche figés (*sticky*) pour un confort de défilement horizontal et vertical optimal.

2. **Règle déontologique de neutralité communale** :
   - Les structures situées sur la propre commune d'un élu sont **automatiquement grisées et impossibles à sélectionner** (curseur interdit + infobulle).
   - Les élus issus de communes sans structures (ex. *Boisset*, *Malvalette*, *Tiranges*, *Valprivas*, *Solignac-sous-Roche*, *Saint-André-de-Chalencon*) peuvent postuler librement sur toutes les structures.
   - Les variantes d'écriture des communes (*Bas en Basset* vs *Bas-en-Basset*, *Monistrol sur Loire* vs *Monistrol-sur-Loire*) sont unifiées sans doublon.

3. **Système de vote par coche (sans limite par élu) & Verrouillage à 2 votes par structure** :
   - Au clic sur une case autorisée, le vote est validé par une coche verte (**✓ Voté**).
   - Chaque élu peut cocher **autant de structures qu'il le souhaite** (aucun plafond par élu).
   - Dès qu'une structure enregistre **2 votes**, elle est considérée comme **complète** : son en-tête affiche `🔒 Complet (2/2)` et toutes ses autres cellules se verrouillent pour les autres élus.
   - **Retrait de vote sécurisé** : un clic sur une structure où l'élu a voté ouvre un dialogue de confirmation pour retirer le vote, ce qui réouvre immédiatement la place pour tous les autres membres.

4. **Guide didactique « Marche à suivre »** :
   - Encart pédagogique placé en en-tête sous le logo pour expliciter les 4 étapes à suivre par les élus en séance.

5. **Persistance en temps réel avec Supabase & Mode hors-ligne** :
   - Les votes sont enregistrés directement dans la base de données Supabase sur une table dédiée (`inscriptions_elus_commission_structures`).
   - Si la table n'a pas encore été créée ou en cas d'absence de réseau, l'application bascule automatiquement sur le stockage local (`localStorage`) et propose le script SQL à copier.
   - Polling automatique toutes les 15 secondes pour actualiser les choix en direct lors de la réunion.

6. **Outils d'animation pour le coordinateur** :
   - Compteurs en temps réel : nombre d'élus ayant voté, total des votes, nombre de structures couvertes.
   - Barre de recherche instantanée par nom d'élu ou par commune.
   - Bouton d'export CSV compatible Excel (avec BOM UTF-8).
   - Bouton d'impression optimisé pour vidéoprojecteur ou tirage papier.

---

## 🚀 Étape 1 : Initialisation de la table Supabase

La base Supabase étant mutualisée avec d'autres projets, le script suivant est **strictement non-destructif** :

1. Connectez-vous sur votre tableau de bord Supabase : [https://supabase.com/dashboard/project/bnloivgpihtsxydjkgyc](https://supabase.com/dashboard/project/bnloivgpihtsxydjkgyc)
2. Ouvrez le **SQL Editor** dans le menu de gauche.
3. Si la table existe déjà, exécutez ce script pour lever la limite de 5 choix et la contrainte de rang unique :

```sql
ALTER TABLE public.inscriptions_elus_commission_structures DROP CONSTRAINT IF EXISTS inscriptions_elus_commission_structures_choix_rang_check;
ALTER TABLE public.inscriptions_elus_commission_structures DROP CONSTRAINT IF EXISTS unique_elu_rang;
ALTER TABLE public.inscriptions_elus_commission_structures ALTER COLUMN choix_rang DROP NOT NULL;
ALTER TABLE public.inscriptions_elus_commission_structures ALTER COLUMN choix_rang SET DEFAULT 1;
```

Ou pour une création initiale :

```sql
CREATE TABLE IF NOT EXISTS public.inscriptions_elus_commission_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elu_nom TEXT NOT NULL,
    elu_commune TEXT NOT NULL,
    structure_nom TEXT NOT NULL,
    structure_commune TEXT NOT NULL,
    choix_rang INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_elu_structure UNIQUE (elu_nom, structure_nom)
);

CREATE INDEX IF NOT EXISTS idx_inscriptions_elu ON public.inscriptions_elus_commission_structures (elu_nom);
CREATE INDEX IF NOT EXISTS idx_inscriptions_structure ON public.inscriptions_elus_commission_structures (structure_nom);

ALTER TABLE public.inscriptions_elus_commission_structures ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inscriptions_elus_commission_structures' AND policyname = 'lecture_publique_inscriptions') THEN
        CREATE POLICY "lecture_publique_inscriptions" ON public.inscriptions_elus_commission_structures FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inscriptions_elus_commission_structures' AND policyname = 'insertion_publique_inscriptions') THEN
        CREATE POLICY "insertion_publique_inscriptions" ON public.inscriptions_elus_commission_structures FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inscriptions_elus_commission_structures' AND policyname = 'modification_publique_inscriptions') THEN
        CREATE POLICY "modification_publique_inscriptions" ON public.inscriptions_elus_commission_structures FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inscriptions_elus_commission_structures' AND policyname = 'suppression_publique_inscriptions') THEN
        CREATE POLICY "suppression_publique_inscriptions" ON public.inscriptions_elus_commission_structures FOR DELETE USING (true);
    END IF;
END $$;
```

---

## 🌐 Étape 2 : Déploiement sur GitHub Pages

L'application est conçue pour être déployée **sans aucune étape de compilation** (*Zero-build*) :

1. Créez un nouveau dépôt sur votre compte GitHub (ex. `commission-enfance-jeunesse-2026`).
2. Dans le terminal local du projet, liez votre dépôt distant et poussez le code :
   ```bash
   git remote add origin https://github.com/VOTRE_COMPTE/VOTRE_DEPOT.git
   git push -u origin main
   ```
3. Sur GitHub, rendez-vous dans les paramètres du dépôt : **Settings** → **Pages** (dans la colonne de gauche).
4. Sous **Build and deployment** :
   - Source : `Deploy from a branch`
   - Branch : `main`
   - Dossier : `/ (root)`
5. Cliquez sur **Save**. Votre application est en ligne en quelques secondes à l'adresse :  
   `https://VOTRE_COMPTE.github.io/VOTRE_DEPOT/`

---

## 💻 Test en local

Pour tester l'application sur votre poste avant la mise en ligne :
```bash
python -m http.server 8000
```
Ouvrez ensuite votre navigateur à l'adresse `http://localhost:8000/`.

---

## 📁 Structure des fichiers

```text
.
├── index.html           # Structure sémantique, en-tête, logo, marche à suivre, grille et modal SQL
├── logo.png             # Logo officiel de la collectivité
├── css/
│   └── styles.css       # Styles CSS modernes (CSS Grid, sticky positioning, thèmes des choix 1-5)
├── js/
│   ├── data.js          # Référentiel unifié des 32 élus, 20 structures et fonctions de normalisation
│   ├── supabase.js      # Client PostgREST Supabase (requêtes REST, RLS anon, gestion d'erreurs/fallback)
│   └── app.js           # Moteur interactif (gestion des clics, réindexation, stats, recherche, export CSV)
├── scripts/
│   └── extract_referentiel.py # Script d'extraction automatisée depuis les classeurs Excel sources
├── Fiche structures.xlsx # Données sources structures
├── Liste des élus.xlsx  # Données sources élus
├── specs/               # Documentation Spec Kit (spécification, plan, tâches, quickstart)
└── README.md            # Documentation de l'application et guide de déploiement
```
