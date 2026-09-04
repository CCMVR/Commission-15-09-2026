# Feature Specification: Inscription des élus aux structures Enfance-Jeunesse

**Feature Branch**: `001-inscription-elus-commission`  
**Created**: 2026-09-04  
**Status**: Ready for Planning  
**Input**: User description: "Je suis coordinateur enfance jeunesse pour une collectivité territoriale et pour une commission enfance jeunesse, j'aimerais pouvoir créer un outil que je vais mettre en ligne sur GitHub avec GitHub Pages et avec une base de données Supabase. Ce que je voudrais, c'est que tu me fasses un tableau plutôt beau, dynamique, bien réalisé, où je vais avoir à gauche mes élus, en ordonnée mes élus sur la gauche, en abscisse mes communes où il y a un centre de loisirs..."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultation et repérage visuel sur la grille interactive (Priority: P1)

En tant qu'élu participant à la commission enfance-jeunesse, je souhaite visualiser l'ensemble des élus de la commission et la liste des structures enfance-jeunesse du territoire sur un tableau clair, moderne et lisible, avec un encart explicatif "Marche à suivre", afin de comprendre immédiatement le fonctionnement et d'identifier où je peux m'investir.

**Why this priority**: C'est le socle ergonomique de l'outil : sans affichage lisible, structuré et didactique de la grille élus / structures, aucune décision d'inscription ne peut être prise sereinement.

**Independent Test**: Accessible directement dès l'ouverture de l'URL GitHub Pages, affichant en en-tête le logo de la collectivité en grand format, un bloc "Marche à suivre" explicatif, en lignes la liste des 32 élus avec leur commune, et en colonnes les communes dotées de structures regroupant chacune leurs structures d'accueil individuelles avec le détail des services proposés.

**Acceptance Scenarios**:
1. **Given** un visiteur arrivant sur la page d'accueil, **When** la page se charge, **Then** le logo de la collectivité apparaît distinctement en grand format, suivi d'un encart pédagogique "Marche à suivre" synthétisant le mode d'emploi en 4 à 5 étapes claires.
2. **Given** la grille dynamique, **When** elle est affichée, **Then** les élus sont en ordonnée (à gauche avec leur commune d'élection) et les structures individuelles sont en abscisse, regroupées visuellement par commune d'implantation (en-têtes de colonnes hiérarchiques).
3. **Given** deux fichiers sources avec des graphies différentes (ex: "Bas en Basset" vs "Bas-en-Basset", "Monistrol sur Loire" vs "Monistrol-sur-Loire"), **When** la grille est construite, **Then** les communes identiques sont automatiquement fusionnées sous un libellé unique harmonisé.
4. **Given** une structure proposant plusieurs services (ex: "Crèche et ALSH et Ados"), **When** l'élu consulte l'en-tête de colonne, **Then** la nature de l'ensemble des services dispensés par la structure est clairement précisée au moyen de badges distinctifs.

---

### User Story 2 - Application de la règle d'incompatibilité communale (Priority: P1)

En tant qu'élu municipal membre de la commission, je ne dois pas pouvoir m'inscrire sur les structures d'accueil situées dans ma propre commune de rattachement, afin d'assurer la neutralité et de favoriser le parrainage croisé sur l'ensemble de l'intercommunalité.

**Why this priority**: C'est la règle métier déontologique centrale énoncée explicitement par le coordinateur.

**Independent Test**: Vérifier pour chaque élu que les cellules correspondant aux structures de sa propre commune apparaissent en gris foncé / hachurées / désactivées, avec interdiction absolue de cliquer ou de cocher.

**Acceptance Scenarios**:
1. **Given** un élu de "Monistrol-sur-Loire" (ex: Virginie BEAU pour Bas-en-Basset ou Nadège BRUNEL pour Monistrol-sur-Loire), **When** cet élu regarde les colonnes associées aux structures de sa propre commune, **Then** toutes les cases correspondantes sont grisées, inactives, avec un curseur interdit et une infobulle/indicateur "Commune d'origine (non sélectionnable)".
2. **Given** un élu issu d'une commune sans structure (ex: Boisset, Malvalette, Tiranges, Valprivas, Solignac-sous-Roche, Saint-André-de-Chalencon), **When** cet élu consulte la grille, **Then** aucune de ses cases n'est grisée par défaut et il peut librement formuler ses vœux sur n'importe quelle structure du territoire.
3. **Given** la Présidente de la communauté de communes (sans commune spécifique attribuée dans la liste principale), **When** sa ligne est affichée, **Then** elle dispose d'un statut institutionnel sans blocage arbitraire.

---

### User Story 3 - Inscription et hiérarchisation ordonnée des choix (Priority: P1)

En tant qu'élu, je souhaite sélectionner en face de mon nom les structures sur lesquelles je désire m'investir pour mon mandat, avec un système de vœux ordonnés (Choix 1 à Choix 5 maximum) attribués au clic successif, et voir mes sélections enregistrées instantanément.

**Why this priority**: C'est la finalité opérationnelle de l'application : recueillir les intentions et priorités d'investissement des élus de manière interactive et sans friction.

**Independent Test**: Cliquer successivement sur des structures autorisées en face de son nom, constater l'assignation automatique de badges "Choix 1", "Choix 2", jusqu'à "Choix 5", et vérifier la possibilité de désélectionner avec recalcul automatique des rangs.

**Acceptance Scenarios**:
1. **Given** un élu voulant s'investir sur une première structure autorisée, **When** il clique sur la case, **Then** la case prend une coloration active et affiche un badge "Choix 1".
2. **Given** un élu ayant déjà un "Choix 1", **When** il clique sur une seconde structure, **Then** celle-ci reçoit le badge "Choix 2", et ainsi de suite jusqu'à un maximum de 5 choix par élu.
3. **Given** un élu ayant atteint le plafond de 5 choix, **When** il tente de cliquer sur une 6ème structure, **Then** une notification non bloquante lui rappelle le plafond de 5 vœux maximum.
4. **Given** un élu ayant validé les choix 1, 2 et 3, **When** il clique à nouveau sur la case "Choix 2", **Then** le choix 2 est annulé, la case redevient vide, et l'ancien "Choix 3" est automatiquement réindexé en "Choix 2".
5. **Given** un utilisateur saisissant les vœux pour le compte d'un collègue absent, **When** il sélectionne la ligne du collègue, **Then** la saisie s'effectue directement sans blocage par mot de passe.

---

### User Story 4 - Persistance temps réel et synchronisation Supabase (Priority: P2)

En tant que coordinateur ou élu, je souhaite que chaque inscription soit sauvegardée immédiatement dans la base Supabase et répercutée en direct auprès des autres membres connectés, sans écraser les autres données existantes de la base de données partagée.

**Why this priority**: Garantit que la commission dispose d'une vue consolidée et pérenne de la répartition des élus, utilisable en direct lors de la séance.

**Independent Test**: Ouvrir l'application dans deux navigateurs distincts, effectuer une inscription dans le premier, et constater la mise à jour immédiate ou après rafraîchissement dans le second.

**Acceptance Scenarios**:
1. **Given** une modification de choix sur la grille, **When** l'action est exécutée, **Then** la donnée est envoyée à l'API Supabase sur la table dédiée `inscriptions_elus_commission_structures` avec indication visuelle "Enregistré".
2. **Given** une base Supabase hébergeant déjà d'autres applications métier, **When** le script SQL d'initialisation est exécuté, **Then** aucune table préexistante n'est altérée ou supprimée (`CREATE TABLE IF NOT EXISTS` avec préfixe spécifique).

---

### Edge Cases

- **Communes sans structure d'accueil** : 6 communes de la commission (Boisset, Malvalette, Saint-André-de-Chalencon, Solignac-sous-Roche, Tiranges, Valprivas) n'ont pas de centre ou de structure répertoriée dans le fichier structures. Le système doit autoriser ces élus à s'inscrire sur l'ensemble des structures existantes.
- **Différences d'écriture des communes** : Fusionner rigoureusement les variantes avec/sans tiret, avec/sans accents, avec espaces multiples ou apostrophes (ex: `Bas en Basset` et `Bas-en-Basset` ; `Sainte Sigolène` et `Sainte-Sigolène` ; `La Chapelle d'Aurec`).
- **Structures multi-services** : Certaines structures assurent simultanément ALSH, Ados, Crèche ou RPE (ex: `Echap'toi` : Crèche, ALSH et Ados ; `Les 6 loupiots` : RPE et crèche). Ces spécificités doivent être lisibles pour éclairer le choix de l'élu.
- **Plafond de 5 choix atteint** : Si un élu a déjà 5 structures sélectionnées, le clic sur une autre structure affiche un message explicatif invitant à désélectionner un choix préalable pour le remplacer.
- **Désélection et réindexation** : Lorsqu'un choix intermédiaire est retiré, le système garantit l'absence de "trous" dans la numérotation (ex. 1, 2, 3 et non 1, 3).
- **Accès simultané ou perte de connexion réseau** : Afficher un indicateur visuel de statut de sauvegarde (Sauvegardé / En cours / Erreur réseau avec bouton Réessayer) pour prévenir toute perte de saisie en réunion.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher le logo officiel de la collectivité territoriale en grand format dans la section d'en-tête de l'outil.
- **FR-002**: Le système DOIT afficher un bloc d'instructions "Marche à suivre" bien visible sous l'en-tête, détaillant les étapes d'utilisation (repérer son nom, grisement de la commune d'origine, sélection des vœux par clic successif du Choix 1 au Choix 5 max, annulation d'un vœu par clic).
- **FR-003**: Le système DOIT harmoniser et fusionner automatiquement les noms de communes identiques présentant des variations orthographiques (espaces, tirets, majuscules/minuscules, accents) entre le fichier des élus et le fichier des structures.
- **FR-004**: Le système DOIT présenter une matrice interactive affichant la liste des élus en ordonnée (lignes à gauche avec leur commune d'appartenance) et les structures d'accueil individuelles en colonnes, regroupées visuellement par commune d'implantation.
- **FR-005**: Le système DOIT afficher pour chaque structure individuelle l'ensemble des types de services associés (ALSH, Ados, Crèche, RPE, Solidarités, Ludothèque) sous forme d'étiquettes ou badges d'identification clairs.
- **FR-006**: Le système DOIT automatiquement griser, verrouiller et rendre non sélectionnables toutes les structures situées sur la commune d'origine de l'élu considéré.
- **FR-007**: Le système DOIT permettre aux élus rattachés à une commune dépourvue de structure de postuler librement à toutes les structures du territoire.
- **FR-008**: Le système DOIT permettre à chaque élu d'attribuer jusqu'à 5 vœux ordonnés (Choix 1, Choix 2, Choix 3, Choix 4, Choix 5) au clic successif par structure individuelle.
- **FR-009**: Le système DOIT réindexer automatiquement les rangs de vœux restants lorsqu'un choix intermédiaire est annulé par un second clic.
- **FR-010**: Le système DOIT être accessible directement sans formulaire d'authentification individuelle préalable, autorisant la saisie collective et pour autrui basée sur la confiance opérationnelle.
- **FR-011**: Le système DOIT synchroniser et persister chaque sélection dans la base de données distante Supabase via l'API REST publique (clé `anon`).
- **FR-012**: Le script de création de base de données DOIT impérativement cibler une table dédiée nommée explicitement (ex: `inscriptions_elus_commission_structures`) et ne JAMAIS exécuter de commande destructive (`DROP TABLE`, `TRUNCATE`) sur les autres tables de la base partagée.
- **FR-013**: Le système DOIT proposer un récapitulatif synthétique ou tableau de bord des affectations (nombre de vœux reçus par structure) pour permettre au coordinateur d'animer la commission en direct.

---

### Key Entities

- **Élu** : Membre élu de la commission. Attributs : Nom, Prénom, Commune de rattachement, Rôle/Titre institutionnel.
- **Commune** : Commune membre de la collectivité. Attributs : Nom officiel unifié, Statut (avec ou sans structure enfance-jeunesse).
- **Structure** : Établissement d'accueil enfance-jeunesse. Attributs : Nom de la structure, Commune d'implantation, Liste des services assurés.
- **Vœu / Inscription** : Inscription d'un élu à une structure. Attributs : Identifiant de l'élu, Identifiant de la structure, Rang de préférence (1 à 5), Horodatage.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un élu ou le coordinateur peut saisir et enregistrer l'ensemble de ses vœux en moins de 45 secondes.
- **SC-002**: 100% des structures de la propre commune de chaque élu sont systématiquement grisées et impossibles à sélectionner.
- **SC-003**: 100% des 20 structures et 32 élus issus des fichiers sources sont correctement chargés et associés sans doublon de commune.
- **SC-004**: Les vœux ordonnés (Choix 1 à 5) sont attribués et réindexés sans incohérence de rang dans 100% des cas.
- **SC-005**: Toute modification apportée sur la grille est persistée sur le serveur distant en moins d'une seconde avec confirmation visuelle.
- **SC-006**: L'application est totalement déployable et opérationnelle sur GitHub Pages en tant qu'application web autonome ne nécessitant aucun serveur applicatif backend dédié.
- **SC-007**: Zéro conflit, altération ou suppression de données existantes dans la base de données Supabase mutualisée.

---

## Assumptions

- **Déploiement** : L'outil est hébergé sous forme de site statique (HTML5, CSS3, JavaScript moderne) déployé via GitHub Pages.
- **Base de données** : Supabase est utilisé avec l'API REST standard (`https://bnloivgpihtsxydjkgyc.supabase.co/rest/v1/`) et la clé anonyme fournie, avec Row Level Security (RLS) configuré pour autoriser `SELECT`, `INSERT`, `UPDATE` et `DELETE` sur la table dédiée `inscriptions_elus_commission_structures`.
- **Gestion des conflits** : Compte tenu de la taille du groupe (environ 30 élus en séance) et du mode de travail en commission, la saisie repose sur la discipline collective convenue ; en cas de mise à jour simultanée, le dernier enregistrement valide prévaut.
- **Affichage** : L'interface intègre une disposition responsive avec en-têtes de colonnes et première colonne des élus figées (sticky headers / columns) pour faciliter la lecture d'un grand tableau horizontal sur écran d'ordinateur ou vidéoprojecteur.
