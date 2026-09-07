/**
 * Référentiel unifié des données de la Commission Enfance Jeunesse
 * Généré automatiquement à partir de Fiche structures.xlsx et Liste des élus.xlsx
 */

export const CANONICAL_COMMUNES = {
  "bas en basset": "Bas-en-Basset",
  "beauzac": "Beauzac",
  "boisset": "Boisset",
  "la chapelle d aurec": "La Chapelle-d'Aurec",
  "les villettes": "Les Villettes",
  "malvalette": "Malvalette",
  "monistrol sur loire": "Monistrol-sur-Loire",
  "saint andre de chalencon": "Saint-André-de-Chalencon",
  "saint pal de chalencon": "Saint-Pal-de-Chalencon",
  "saint pal de mons": "Saint-Pal-de-Mons",
  "sainte sigolene": "Sainte-Sigolène",
  "solignac sous roche": "Solignac-sous-Roche",
  "tiranges": "Tiranges",
  "valprivas": "Valprivas"
};

export function normalizeCommune(name) {
    if (!name) return "";
    return name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .toLowerCase();
}

export function isCommuneBlocked(eluCommune, structureCommune) {
    if (!eluCommune || !structureCommune) return false;
    const n1 = normalizeCommune(eluCommune);
    const n2 = normalizeCommune(structureCommune);
    return n1 === n2;
}

export const COMMUNES_AVEC_STRUCTURES = [
  "Bas-en-Basset",
  "Beauzac",
  "La Chapelle-d'Aurec",
  "Les Villettes",
  "Monistrol-sur-Loire",
  "Saint-Pal-de-Chalencon",
  "Saint-Pal-de-Mons",
  "Sainte-Sigolène"
];

export const STRUCTURES = [
  {
    "id": "acija",
    "name": "ACIJA",
    "commune": "Monistrol-sur-Loire",
    "services": [
      "Solidarités"
    ],
    "servicesLabel": "Solidarités"
  },
  {
    "id": "mjc",
    "name": "MJC",
    "commune": "Monistrol-sur-Loire",
    "services": [
      "Ados"
    ],
    "servicesLabel": "Ados"
  },
  {
    "id": "le-beauvoir",
    "name": "Le Beauvoir",
    "commune": "Monistrol-sur-Loire",
    "services": [
      "ALSH"
    ],
    "servicesLabel": "ALSH"
  },
  {
    "id": "cap-evasion",
    "name": "Cap Evasion",
    "commune": "Beauzac",
    "services": [
      "ALSH",
      "Ados"
    ],
    "servicesLabel": "ALSH et Ados"
  },
  {
    "id": "familles-rurales-club-jeunesse",
    "name": "Familles rurales / Club Jeunesse",
    "commune": "Monistrol-sur-Loire",
    "services": [
      "ALSH"
    ],
    "servicesLabel": "ALSH"
  },
  {
    "id": "la-magie-du-jeu",
    "name": "La magie du jeu",
    "commune": "Sainte-Sigolène",
    "services": [
      "ALSH"
    ],
    "servicesLabel": "ALSH"
  },
  {
    "id": "familles-rurales-arc-en-jeux",
    "name": "Familles rurales - Arc en jeux",
    "commune": "Bas-en-Basset",
    "services": [
      "ALSH"
    ],
    "servicesLabel": "ALSH"
  },
  {
    "id": "echap-toi",
    "name": "Echap'toi",
    "commune": "La Chapelle-d'Aurec",
    "services": [
      "Crèche",
      "ALSH",
      "Ados"
    ],
    "servicesLabel": "Crèche et ALSH et Ados"
  },
  {
    "id": "familles-rurales-sympas-loups",
    "name": "Familles rurales - Sympas Loups",
    "commune": "Saint-Pal-de-Mons",
    "services": [
      "ALSH",
      "Ados"
    ],
    "servicesLabel": "ALSH et Ados"
  },
  {
    "id": "oxygene",
    "name": "Oxygène",
    "commune": "Les Villettes",
    "services": [
      "ALSH",
      "Ados"
    ],
    "servicesLabel": "ALSH et Ados"
  },
  {
    "id": "planet-air",
    "name": "Planet'air",
    "commune": "Sainte-Sigolène",
    "services": [
      "ALSH",
      "Ados"
    ],
    "servicesLabel": "ALSH et Ados"
  },
  {
    "id": "les-tetes-en-l-air",
    "name": "Les têtes en l'air",
    "commune": "Saint-Pal-de-Chalencon",
    "services": [
      "ALSH"
    ],
    "servicesLabel": "ALSH"
  },
  {
    "id": "ricochet",
    "name": "Ricochet",
    "commune": "Sainte-Sigolène",
    "services": [
      "Ludothèque"
    ],
    "servicesLabel": "Ludothèque"
  },
  {
    "id": "au-royaume-des-lutins",
    "name": "Au royaume des lutins",
    "commune": "Beauzac",
    "services": [
      "Crèche"
    ],
    "servicesLabel": "Crèche"
  },
  {
    "id": "l-envol",
    "name": "l'Envol",
    "commune": "Bas-en-Basset",
    "isDsp": true,
    "services": [
      "Crèche",
      "DSP"
    ],
    "servicesLabel": "Crèche (DSP)"
  },
  {
    "id": "les-marmousets",
    "name": "Les Marmousets",
    "commune": "Monistrol-sur-Loire",
    "services": [
      "Crèche"
    ],
    "servicesLabel": "Crèche"
  },
  {
    "id": "pirouette",
    "name": "Pirouette",
    "commune": "Saint-Pal-de-Mons",
    "services": [
      "Crèche"
    ],
    "servicesLabel": "Crèche"
  },
  {
    "id": "toboggan",
    "name": "Toboggan",
    "commune": "Sainte-Sigolène",
    "services": [
      "Crèche"
    ],
    "servicesLabel": "Crèche"
  },
  {
    "id": "familles-rurales-la-farandole",
    "name": "Familles Rurales - La Farandole",
    "commune": "Bas-en-Basset",
    "services": [
      "RPE"
    ],
    "servicesLabel": "RPE"
  },
  {
    "id": "les-6-loupiots",
    "name": "Les 6 loupiots",
    "commune": "Monistrol-sur-Loire",
    "services": [
      "RPE",
      "crèche"
    ],
    "servicesLabel": "RPE et crèche"
  }
];

export const ELUS = [
  {
    "id": "duplain-jocelyne",
    "name": "DUPLAIN Jocelyne",
    "commune": "CC Marches du Velay Rochebaron",
    "role": "Présidente de la Communauté de communes"
  },
  {
    "id": "beau-virginie",
    "name": "BEAU Virginie",
    "commune": "Bas-en-Basset",
    "role": "Membre de la commission"
  },
  {
    "id": "berthet-sarah",
    "name": "BERTHET Sarah",
    "commune": "Tiranges",
    "role": "Membre de la commission"
  },
  {
    "id": "brunel-nadege",
    "name": "BRUNEL Nadège",
    "commune": "Monistrol-sur-Loire",
    "role": "Membre de la commission"
  },
  {
    "id": "buhnemann-christiane",
    "name": "BUHNEMANN Christiane",
    "commune": "Saint-Pal-de-Chalencon",
    "role": "Membre de la commission"
  },
  {
    "id": "capdevielle-florian",
    "name": "CAPDEVIELLE Florian",
    "commune": "Boisset",
    "role": "Membre de la commission"
  },
  {
    "id": "celle-valerie",
    "name": "CELLE Valérie",
    "commune": "Sainte-Sigolène",
    "role": "Membre de la commission"
  },
  {
    "id": "civet-marie-laure",
    "name": "CIVET Marie-Laure",
    "commune": "La Chapelle-d'Aurec",
    "role": "Membre de la commission"
  },
  {
    "id": "colson-luce",
    "name": "COLSON Luce",
    "commune": "Saint-André-de-Chalencon",
    "role": "Membre de la commission"
  },
  {
    "id": "decultis-emilie",
    "name": "DECULTIS Emilie",
    "commune": "Beauzac",
    "role": "Membre de la commission"
  },
  {
    "id": "delpy-xavier",
    "name": "DELPY Xavier",
    "commune": "Saint-André-de-Chalencon",
    "role": "Membre de la commission"
  },
  {
    "id": "dupuis-gaelle",
    "name": "DUPUIS Gaëlle",
    "commune": "Saint-Pal-de-Mons",
    "role": "Membre de la commission"
  },
  {
    "id": "dupuy-dominique",
    "name": "DUPUY Dominique",
    "commune": "Bas-en-Basset",
    "role": "Membre de la commission"
  },
  {
    "id": "esteve-gonnet-antoinette",
    "name": "ESTEVE GONNET Antoinette",
    "commune": "La Chapelle-d'Aurec",
    "role": "Membre de la commission"
  },
  {
    "id": "fontvieille-monique",
    "name": "FONTVIEILLE Monique",
    "commune": "Valprivas",
    "role": "Membre de la commission"
  },
  {
    "id": "gameiro-isabelle",
    "name": "GAMEIRO Isabelle",
    "commune": "Sainte-Sigolène",
    "role": "Membre de la commission"
  },
  {
    "id": "giraud-nathalie",
    "name": "GIRAUD Nathalie",
    "commune": "Monistrol-sur-Loire",
    "role": "Membre de la commission"
  },
  {
    "id": "jasserand-marie-laure",
    "name": "JASSERAND Marie-Laure",
    "commune": "Boisset",
    "role": "Membre de la commission"
  },
  {
    "id": "liothier-claudine",
    "name": "LIOTHIER Claudine",
    "commune": "Valprivas",
    "role": "Membre de la commission"
  },
  {
    "id": "massardier-maryvonne",
    "name": "MASSARDIER Maryvonne",
    "commune": "Saint-Pal-de-Mons",
    "role": "Membre de la commission"
  },
  {
    "id": "navarro-josee",
    "name": "NAVARRO Josée",
    "commune": "Sainte-Sigolène",
    "role": "Membre de la commission"
  },
  {
    "id": "ollagnier-jacqueline",
    "name": "OLLAGNIER Jacqueline",
    "commune": "Malvalette",
    "role": "Membre de la commission"
  },
  {
    "id": "ollivier-kevin",
    "name": "OLLIVIER Kévin",
    "commune": "Beauzac",
    "role": "Membre de la commission"
  },
  {
    "id": "paquet-nadine",
    "name": "PAQUET Nadine",
    "commune": "Bas-en-Basset",
    "role": "Membre de la commission"
  },
  {
    "id": "pichon-cecile",
    "name": "PICHON Cécile",
    "commune": "Les Villettes",
    "role": "Membre de la commission"
  },
  {
    "id": "rey-dominique",
    "name": "REY Dominique",
    "commune": "Solignac-sous-Roche",
    "role": "Membre de la commission"
  },
  {
    "id": "ribeyron-joelle",
    "name": "RIBEYRON Joëlle",
    "commune": "Tiranges",
    "role": "Membre de la commission"
  },
  {
    "id": "richard-sarah",
    "name": "RICHARD Sarah",
    "commune": "Monistrol-sur-Loire",
    "role": "Membre de la commission"
  },
  {
    "id": "soleilhac-pauline",
    "name": "SOLEILHAC Pauline",
    "commune": "Solignac-sous-Roche",
    "role": "Membre de la commission"
  },
  {
    "id": "valentin-therese",
    "name": "VALENTIN Thérèse",
    "commune": "Saint-Pal-de-Chalencon",
    "role": "Membre de la commission"
  },
  {
    "id": "verdy-sandrine",
    "name": "VERDY Sandrine",
    "commune": "Les Villettes",
    "role": "Membre de la commission"
  },
  {
    "id": "willig-bernadette",
    "name": "WILLIG Bernadette",
    "commune": "Malvalette",
    "role": "Membre de la commission"
  }
];
