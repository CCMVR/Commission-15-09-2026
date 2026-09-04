# Phase 0: Research & Technical Decisions

**Feature**: `001-inscription-elus-commission`  
**Date**: 2026-09-04  
**Status**: Completed

---

## 1. Architecture du Frontend

### Décision
Adopter une architecture **SPA statique légère sans étape de compilation (Zero-build Modern Web)** composée de :
- `index.html` : Structure sémantique de l'application (en-tête avec logo, panneau didactique "Marche à suivre", tableau de bord synthétique, matrice dynamique des inscriptions).
- `css/styles.css` : Styles modernes (variables CSS, mise en page Grid / Flexbox, frozen headers/columns pour le défilement horizontal et vertical, thèmes visuels des badges de choix 1 à 5).
- `js/app.js` : Logique applicative modulaire (chargement des référentiels élus et structures, gestion des interactions utilisateur, calcul des rangs de vœux, contrôle des incompatibilités communales, synchronisation Supabase).
- `js/supabase-client.js` : Module dédié d'interaction avec l'API PostgREST Supabase.
- `js/data.js` : Référentiel unifié des 33 élus et 20 structures extrait des fichiers Excel sources.

### Justification
1. **Compatibilité GitHub Pages native à 100%** : Aucun runner ou bundler (Vite, Webpack) requis. Tout commit sur `main` est immédiatement déployé et opérationnel.
2. **Zéro latence au démarrage** : Pas de chargement de bibliothèque lourde, affichage instantané de la grille même avec une connexion Internet modeste en salle de réunion.
3. **Pérennité et maintenabilité** : Le code source reste directement lisible, modifiable et débogable depuis n'importe quel éditeur ou outil de dev du navigateur.

### Alternatives considérées
- *React / Vue / Svelte avec build Vite* : Ajoute une complexité inutile de build (dépendances npm, artefacts `dist/`, configuration de pipeline GitHub Actions) pour une application mono-page ciblée sur un tableau de saisie.
- *Google Sheets / Forms* : Ne permet pas d'appliquer la règle métier stricte de grisement dynamique selon la commune de chaque élu ni la réindexation automatique des choix 1 à 5.

---

## 2. Intégration Supabase & Gestion de la persistance

### Décision
Utiliser directement l'API PostgREST native de Supabase via `fetch` avec la clé publique `anon`, ciblant une table unique et explicitement isolée : `inscriptions_elus_commission_structures`.

### Spécifications de la table SQL
```sql
CREATE TABLE IF NOT EXISTS public.inscriptions_elus_commission_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elu_nom TEXT NOT NULL,
    elu_commune TEXT NOT NULL,
    structure_nom TEXT NOT NULL,
    structure_commune TEXT NOT NULL,
    choix_rang INTEGER NOT NULL CHECK (choix_rang BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_elu_structure UNIQUE (elu_nom, structure_nom),
    CONSTRAINT unique_elu_rang UNIQUE (elu_nom, choix_rang)
);

-- Activation de Row Level Security (RLS)
ALTER TABLE public.inscriptions_elus_commission_structures ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès anonymes sécurisées et ciblées
CREATE POLICY "lecture_publique_inscriptions" 
ON public.inscriptions_elus_commission_structures 
FOR SELECT 
USING (true);

CREATE POLICY "insertion_publique_inscriptions" 
ON public.inscriptions_elus_commission_structures 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "modification_publique_inscriptions" 
ON public.inscriptions_elus_commission_structures 
FOR UPDATE 
USING (true);

CREATE POLICY "suppression_publique_inscriptions" 
ON public.inscriptions_elus_commission_structures 
FOR DELETE 
USING (true);
```

### Justification
1. **Isolation stricte** : Aucune directive destructive (`DROP`, `TRUNCATE`). La table est préfixée et entièrement autonome, éliminant tout risque d'altération des autres bases hébergées sur l'instance.
2. **Légèreté & Fiabilité** : L'utilisation directe de l'API REST PostgREST (`GET /rest/v1/inscriptions_elus_commission_structures`, `POST`, `DELETE`) évite de dépendre du CDN pour le SDK JS de Supabase, évitant ainsi les pannes en cas de blocage de CDN tiers sur les réseaux de collectivités.
3. **Contraintes d'intégrité** : Deux contraintes `UNIQUE` au niveau de PostgreSQL empêchent physiquement les doublons (un élu ne peut choisir deux fois la même structure, et un élu ne peut avoir deux fois le même rang de choix).

### Alternatives considérées
- *Supabase Realtime WebSocket* : Intéressant mais peut être bloqué par les proxys stricts de certaines collectivités territoriales. Un mécanisme de polling doux (toutes les 10 secondes) ou rafraîchissement au clic combiné à la mise à jour optimiste locale assure 100% de fiabilité.

---

## 3. Algorithme de normalisation et d'appariement des communes

### Décision
Mettre en place une fonction de normalisation stricte `normalizeCommune(name)` qui :
1. Supprime les accents et caractères diacritiques (NFD / unicode).
2. Remplace les tirets et apostrophes par des espaces.
3. Supprime les espaces multiples et passe en minuscules.
4. Mappe les variantes connues vers un libellé officiel unique.

### Table de correspondance validée
| Commune Fichier Élus | Commune Fichier Structures | Libellé Harmonisé Officiel | Présence de Structures |
|---|---|---|:---:|
| Bas en Basset | Bas-en-Basset | **Bas-en-Basset** | Oui (3 structures) |
| Monistrol sur Loire | Monistrol-sur-Loire | **Monistrol-sur-Loire** | Oui (6 structures) |
| Sainte Sigolène | Sainte-Sigolène | **Sainte-Sigolène** | Oui (4 structures) |
| Beauzac | Beauzac | **Beauzac** | Oui (2 structures) |
| Saint Pal de Mons | Saint-Pal-de-Mons | **Saint-Pal-de-Mons** | Oui (2 structures) |
| Saint Pal de Chalencon | Saint-Pal-de-Chalencon | **Saint-Pal-de-Chalencon** | Oui (1 structure) |
| La Chapelle d'Aurec | La Chapelle d'Aurec | **La Chapelle-d'Aurec** | Oui (1 structure) |
| Les Villettes | Les Villettes | **Les Villettes** | Oui (1 structure) |
| Boisset | *(aucune)* | **Boisset** | Non |
| Malvalette | *(aucune)* | **Malvalette** | Non |
| Saint André de Chalencon | *(aucune)* | **Saint-André-de-Chalencon** | Non |
| Solignac sous Roche | *(aucune)* | **Solignac-sous-Roche** | Non |
| Tiranges | *(aucune)* | **Tiranges** | Non |
| Valprivas | *(aucune)* | **Valprivas** | Non |

### Règle de blocage / grisement
`isBlocked(elu, structure)` renvoie `true` si et seulement si `normalizeCommune(elu.commune) === normalizeCommune(structure.commune)`.
Dans ce cas, la cellule est rendue inaccessible (attribut `disabled`, classe `cell-blocked`, curseur `not-allowed`).

---

## 4. Gestion des vœux ordonnés (Choix 1 à 5)

### Décision
1. Chaque clic sur une cellule autorisée non cochée ajoute la structure aux vœux de l'élu au rang `N + 1` (où N est le nombre actuel de vœux, avec max N = 5).
2. La cellule affiche un badge distinctif :
   - Choix 1 : Badge Doré / Ambre (`#f59e0b`)
   - Choix 2 : Badge Bleu Indigo (`#3b82f6`)
   - Choix 3 : Badge Émeraude (`#10b981`)
   - Choix 4 : Badge Violet (`#8b5cf6`)
   - Choix 5 : Badge Cyan (`#06b6d4`)
3. Chaque clic sur une cellule déjà cochée désélectionne la structure, la supprime de la base et décrémente automatiquement le rang de tous les choix supérieurs (ex: si le Choix 2 est supprimé, le Choix 3 devient Choix 2, le Choix 4 devient Choix 3, le Choix 5 devient Choix 4).
4. Si 5 choix sont déjà formulés, une infobulle prévenante avertit l'utilisateur : *"Plafond de 5 choix atteint. Pour ajouter cette structure, désélectionnez d'abord un autre vœu."*
