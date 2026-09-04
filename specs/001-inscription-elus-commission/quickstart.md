# Quickstart & Validation Guide: Inscription des élus aux structures Enfance-Jeunesse

**Feature**: `001-inscription-elus-commission`  
**Date**: 2026-09-04

---

## 1. Prérequis

1. Avoir accès au tableau de bord Supabase du projet pour exécuter le script SQL :
   - Fichier script : [`contracts/supabase-schema.sql`](./contracts/supabase-schema.sql)
2. Disposer d'un navigateur moderne (Chrome, Edge, Firefox, Safari).
3. Disposer d'un serveur web local léger (ou extension Live Server de VS Code, ou `python -m http.server 8000`).

---

## 2. Étape 1 : Initialisation de la table Supabase

1. Connectez-vous sur votre interface Supabase : `https://supabase.com/dashboard/project/bnloivgpihtsxydjkgyc`.
2. Ouvrez l'onglet **SQL Editor**.
3. Copiez-collez le contenu de [`contracts/supabase-schema.sql`](./contracts/supabase-schema.sql).
4. Cliquez sur **Run**.
5. Vérifiez que la table `inscriptions_elus_commission_structures` apparaît dans le **Table Editor** (vide au départ).

---

## 3. Étape 2 : Lancement local de l'application

Ouvrez un terminal dans le répertoire du projet et lancez :
```bash
python -m http.server 8000
```
Puis accédez à `http://localhost:8000/` dans votre navigateur.

---

## 4. Scénarios de Test et Validation Métier

### Scénario A : Vérification du logo et du panneau "Marche à suivre"
- **Action** : Charger la page.
- **Résultat attendu** :
  - Le logo officiel (`logo.png`) s'affiche nettement en haut de page.
  - Le bloc "Marche à suivre" présente 4 étapes claires et bien formatées.
  - Le tableau synthétique indique 0 vœu enregistré et 0 / 33 élus inscrits.

### Scénario B : Vérification du grisement de la commune d'origine
- **Action** : Repérer la ligne de l'élue `BEAU Virginie` (Commune : Bas-en-Basset).
- **Résultat attendu** :
  - Les 3 colonnes de structures situées à Bas-en-Basset (*Familles rurales - Arc en jeux*, *l'Envol*, *Familles Rurales - La Farandole*) sont grisées et inactives.
  - Le survol de ces cases affiche un curseur interdit et l'infobulle : *"Commune d'origine : Bas-en-Basset (non sélectionnable)"*.

### Scénario C : Vérification pour un élu d'une commune sans structure
- **Action** : Repérer la ligne de l'élu `CAPDEVIELLE Florian` (Commune : Boisset).
- **Résultat attendu** :
  - Boisset ne possède aucune structure enfance-jeunesse.
  - Aucune colonne n'est grisée pour cet élu : il peut choisir librement parmi les 20 structures.

### Scénario D : Attribution successive des vœux ordonnés (Choix 1 à 5)
- **Action** : Pour `CAPDEVIELLE Florian` :
  1. Cliquer sur la structure *ACIJA* (Monistrol-sur-Loire) → un badge doré **"Choix 1"** apparaît.
  2. Cliquer sur *Cap Evasion* (Beauzac) → un badge bleu **"Choix 2"** apparaît.
  3. Cliquer sur *La magie du jeu* (Sainte-Sigolène) → un badge vert **"Choix 3"** apparaît.
  4. Cliquer sur *Oxygène* (Les Villettes) → un badge violet **"Choix 4"** apparaît.
  5. Cliquer sur *Toboggan* (Sainte-Sigolène) → un badge cyan **"Choix 5"** apparaît.
  6. Tenter de cliquer sur une 6ème structure (*Planet'air*) → une alerte discrète indique : *"Plafond de 5 vœux atteint. Désélectionnez une structure pour la remplacer."*

### Scénario E : Désélection et réindexation automatique des rangs
- **Action** : Sur la même ligne, cliquer à nouveau sur la case *Cap Evasion* (qui était le Choix 2).
- **Résultat attendu** :
  - La case *Cap Evasion* redevient blanche/neutre.
  - *La magie du jeu* passe automatiquement de **Choix 3** à **Choix 2**.
  - *Oxygène* passe de **Choix 4** à **Choix 3**.
  - *Toboggan* passe de **Choix 5** à **Choix 4**.
  - La base Supabase est mise à jour immédiatement.

### Scénario F : Déploiement GitHub Pages
1. Créer le dépôt sur GitHub.
2. Pousser la branche `main` : `git push origin main`.
3. Activer **GitHub Pages** dans les paramètres du dépôt (Source : branche `main`, racine `/`).
4. L'URL publique fonctionne immédiatement sans étape de compilation.
