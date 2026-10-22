export type Chapter =
  | "petite-enfance"
  | "ecole"
  | "adolescence"
  | "debut-de-vie"
  | "vie-active"
  | "retraite"
  | "fin-de-vie";

export type EventKind = "arrivee" | "ordinaire" | "heureux" | "difficile" | "historique" | "fin";

export interface SourceCitation {
  id: string;
  label: string;
  url: string;
  publisher: string;
  vintage: string;
  field: string;
  denominator: string;
  method: string;
  license: string;
  uncertainty: string;
  status: "a-verifier" | "synthetique" | "observe";
}

export interface DatasetManifest {
  id: string;
  version: string;
  mode: "SYNTHETIC_DEMO" | "VALIDATED_FRANCE";
  generatedAt: string;
  coverage: string;
  exclusions: string[];
  sources: SourceCitation[];
}

export interface BirthDistribution {
  basis: string;
  denominator: string;
  territories: Array<{ territory: string; weight: number }>;
}

export interface DemoData {
  manifest: DatasetManifest;
  birthDistribution: BirthDistribution;
}

export interface DelayedEffect {
  atAge: number;
  label: string;
  effects: ChoiceEffects;
}

export interface ChoiceEffects {
  health?: number;
  fulfillment?: number;
  learning?: number;
  relationships?: number;
  budgetStress?: number;
  incomeMonthly?: number;
  debt?: number;
  education?: string;
  housing?: string;
  employment?: string;
}

export interface Choice {
  id: string;
  age: number;
  title: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    detail: string;
    cost: string;
    effects: ChoiceEffects;
    delayed?: DelayedEffect;
  }>;
  sensitivity: "standard" | "sensible";
}

export interface LifeEvent {
  id: string;
  age: number;
  year: number;
  chapter: Chapter;
  title: string;
  body: string;
  kind: EventKind;
  sensitivity: "standard" | "sensible";
  assumptionId: string;
  sourceId: string;
  choiceId?: string;
}

export interface PersonState {
  version: string;
  seed: string;
  age: number;
  year: number;
  alive: boolean;
  territory: string;
  household: string;
  socialOrigin: string;
  housing: string;
  education: string;
  employment: string;
  incomeMonthly: number;
  debt: number;
  health: number;
  fulfillment: number;
  learning: number;
  relationships: number;
  budgetStress: number;
  pendingChoiceId: string | null;
  pendingEffects: DelayedEffect[];
  decisions: string[];
  timeline: LifeEvent[];
  journal: string[];
  deathAge: number | null;
  modeLabel: string;
}

export interface GameSnapshot {
  savedAt: string;
  dataVersion: string;
  state: PersonState;
}

export interface SeededRng {
  next: () => number;
  integer: (maxExclusive: number) => number;
  pick: <T>(items: T[]) => T;
}

const BASE_YEAR = 2026;
const VERSION = "demo-engine-0.1";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRng(seed: string): SeededRng {
  let value = hashSeed(seed) || 1;
  const next = () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    integer: (maxExclusive) => Math.floor(next() * maxExclusive),
    pick: <T>(items: T[]) => items[Math.min(items.length - 1, Math.floor(next() * items.length))],
  };
}

function weightedPick<T extends { weight: number }>(items: T[], rng: SeededRng): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = rng.next() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function chapterForAge(age: number): Chapter {
  if (age <= 5) return "petite-enfance";
  if (age <= 11) return "ecole";
  if (age <= 17) return "adolescence";
  if (age <= 29) return "debut-de-vie";
  if (age <= 59) return "vie-active";
  if (age <= 84) return "retraite";
  return "fin-de-vie";
}

const EVENT_LIBRARY: Array<Omit<LifeEvent, "age" | "year" | "chapter" | "sourceId"> & { minAge: number; maxAge: number }> = [
  { id: "birth-arrival", minAge: 0, maxAge: 0, title: "Un premier matin", body: "Une respiration, puis une autre. Une vie commence dans un lieu que personne n'a choisi seul.", kind: "arrivee", sensitivity: "standard", assumptionId: "event-fiction-001" },
  { id: "first-steps", minAge: 1, maxAge: 3, title: "Le monde à hauteur de genoux", body: "Les pièces deviennent des paysages. Un adulte tend la main, puis la retire doucement.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-002" },
  { id: "safe-routine", minAge: 2, maxAge: 5, title: "Une routine qui rassure", body: "Le quotidien s'organise autour de petits repères : une voix, une lumière, un trajet connu.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-003" },
  { id: "school-gate", minAge: 6, maxAge: 6, title: "Le portail de l'école", body: "Le premier matin, le bruit paraît immense. Puis un visage devient familier.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-004" },
  { id: "school-friend", minAge: 7, maxAge: 9, title: "Une place à côté", body: "Une rencontre simple change la géographie d'une cour de récréation.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-005" },
  { id: "library", minAge: 8, maxAge: 11, title: "La bibliothèque", body: "Un livre ouvert devient une fenêtre. On y trouve des questions qui n'attendent pas de réponse immédiate.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-006" },
  { id: "school-support", minAge: 9, maxAge: 11, title: "Un détour utile", body: "Une difficulté est repérée. Avec du temps et un accompagnement, elle cesse d'être un secret.", kind: "difficile", sensitivity: "sensible", assumptionId: "event-fiction-007" },
  { id: "first-collective", minAge: 10, maxAge: 13, title: "Faire avec les autres", body: "Un projet commun apprend que les rythmes ne sont pas les mêmes, et que cela peut devenir une force.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-008" },
  { id: "adolescent-room", minAge: 12, maxAge: 14, title: "Une chambre à soi", body: "La porte se ferme plus souvent. Derrière, une identité s'essaie sans devoir être définitive.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-009" },
  { id: "health-check", minAge: 13, maxAge: 17, title: "Prendre soin de soi", body: "Un rendez-vous rappelle que la santé n'est pas une note : c'est une relation à entretenir.", kind: "ordinaire", sensitivity: "sensible", assumptionId: "event-fiction-010" },
  { id: "exam-day", minAge: 15, maxAge: 18, title: "Le jour d'après les examens", body: "Le résultat ouvre une porte, mais ne ferme pas toutes les autres.", kind: "difficile", sensitivity: "standard", assumptionId: "event-fiction-011" },
  { id: "mentor", minAge: 16, maxAge: 21, title: "Une personne qui voit le possible", body: "Quelqu'un prend le temps d'expliquer un chemin que l'on ne connaissait pas.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-012" },
  { id: "first-application", minAge: 18, maxAge: 23, title: "Le premier dossier", body: "Les formulaires s'empilent. La vie adulte commence parfois par une série de cases à remplir.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-013" },
  { id: "shared-home", minAge: 20, maxAge: 28, title: "Un logement partagé", body: "On apprend à compter les mètres carrés, les horaires et les gestes qui rendent un lieu habitable.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-014" },
  { id: "first-contract", minAge: 21, maxAge: 29, title: "Le premier contrat", body: "Un salaire arrive. Il donne de l'air, sans rendre les choix simples.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-015" },
  { id: "move", minAge: 24, maxAge: 35, title: "Changer de quartier", body: "Un nouveau trajet, de nouvelles habitudes, une manière différente de regarder la même ville.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-016" },
  { id: "job-loss", minAge: 28, maxAge: 50, title: "Le travail s'arrête", body: "La perte d'un emploi touche le budget, mais aussi le temps, l'image de soi et les projets.", kind: "difficile", sensitivity: "sensible", assumptionId: "event-fiction-017" },
  { id: "training", minAge: 30, maxAge: 55, title: "Apprendre à nouveau", body: "Une compétence ancienne rencontre un besoin nouveau. La reconversion commence par une curiosité.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-018" },
  { id: "care-work", minAge: 35, maxAge: 60, title: "Être là pour quelqu'un", body: "Le temps se partage autrement quand un proche a besoin d'aide. Les limites deviennent une question collective.", kind: "difficile", sensitivity: "sensible", assumptionId: "event-fiction-019" },
  { id: "promotion", minAge: 34, maxAge: 55, title: "Une marche de plus", body: "Une responsabilité arrive. Elle apporte de la reconnaissance et de nouvelles tensions.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-020" },
  { id: "quiet-weekend", minAge: 40, maxAge: 59, title: "Un week-end sans urgence", body: "Rien de spectaculaire. Juste la sensation rare d'avoir du temps qui ne demande pas à être rempli.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-021" },
  { id: "community", minAge: 45, maxAge: 69, title: "La vie du quartier", body: "Une réunion, une main tendue, un désaccord aussi. Faire société tient souvent à ces rendez-vous modestes.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-022" },
  { id: "health-slowdown", minAge: 50, maxAge: 75, title: "Ralentir sans renoncer", body: "Le corps demande une autre cadence. Cela oblige à trier, pas à disparaître.", kind: "difficile", sensitivity: "sensible", assumptionId: "event-fiction-023" },
  { id: "retirement", minAge: 60, maxAge: 64, title: "Le dernier jour de travail", body: "Une porte se ferme. La journée s'étire autrement, avec ses possibilités et ses silences.", kind: "historique", sensitivity: "standard", assumptionId: "event-fiction-024" },
  { id: "volunteering", minAge: 62, maxAge: 78, title: "Donner du temps", body: "Une compétence quitte le CV et circule autrement : dans une association, un atelier, une présence.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-025" },
  { id: "new-routine", minAge: 68, maxAge: 84, title: "Une nouvelle saison", body: "Les liens se choisissent plus consciemment. Les petits rituels prennent de l'importance.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-026" },
  { id: "transmission", minAge: 72, maxAge: 90, title: "Transmettre sans posséder", body: "Une histoire, une recette, un geste : ce qui reste ne tient pas toujours dans une boîte.", kind: "heureux", sensitivity: "standard", assumptionId: "event-fiction-027" },
  { id: "quiet-morning", minAge: 80, maxAge: 99, title: "Une matinée très claire", body: "Les années forment un paysage. On n'y voit pas tout, mais on reconnaît certains chemins.", kind: "ordinaire", sensitivity: "standard", assumptionId: "event-fiction-028" },
  { id: "last-page", minAge: 100, maxAge: 110, title: "La dernière page", body: "La simulation s'arrête ici. Elle ne mesure pas une valeur : elle raconte seulement un parcours possible.", kind: "fin", sensitivity: "sensible", assumptionId: "event-fiction-029" },
];

const CHOICES: Choice[] = [
  { id: "choice-06", age: 6, title: "Une première bifurcation", prompt: "Quel environnement prend le plus de place cette année ?", sensitivity: "standard", options: [
    { id: "atelier", label: "L'atelier du quartier", detail: "Un espace collectif, manuel et ouvert.", cost: "Temps de trajet", effects: { learning: 7, relationships: 8, fulfillment: 4 } },
    { id: "soutien", label: "Un soutien régulier", detail: "Un accompagnement calme pour consolider les bases.", cost: "Moins de temps libre", effects: { learning: 12, health: 2, relationships: -2 } },
    { id: "maison", label: "Le temps à la maison", detail: "Un rythme plus protégé, avec moins de déplacements.", cost: "Moins de rencontres", effects: { health: 5, fulfillment: 5, relationships: -3 } },
  ] },
  { id: "choice-08", age: 8, title: "Une activité après l'école", prompt: "Une place se libère. Où va-t-elle ?", sensitivity: "standard", options: [
    { id: "sport", label: "Le club de sport", detail: "Une équipe, des règles et un corps qui apprend.", cost: "Cotisation fictive", effects: { health: 9, relationships: 7 } },
    { id: "musique", label: "La musique", detail: "Un instrument, une patience, un son qui arrive peu à peu.", cost: "Matériel et répétition", effects: { learning: 10, fulfillment: 8 } },
  ] },
  { id: "choice-10", age: 10, title: "Faire une place à la curiosité", prompt: "Une question revient souvent. Comment la suivre ?", sensitivity: "standard", options: [
    { id: "bibliotheque", label: "La bibliothèque", detail: "Chercher seul, puis demander de l'aide.", cost: "Temps calme", effects: { learning: 11, fulfillment: 5 } },
    { id: "amis", label: "Le groupe d'amis", detail: "Construire une réponse à plusieurs.", cost: "Énergie sociale", effects: { relationships: 11, fulfillment: 6 } },
  ] },
  { id: "choice-12", age: 12, title: "Une voix qui se construit", prompt: "Que faire d'un désaccord qui grandit ?", sensitivity: "sensible", options: [
    { id: "dialogue", label: "Chercher le dialogue", detail: "Dire ce qui compte, sans chercher à gagner.", cost: "Vulnérabilité", effects: { relationships: 9, fulfillment: 7 } },
    { id: "creation", label: "Créer quelque chose", detail: "Transformer l'énergie en dessin, texte ou musique.", cost: "Temps et solitude", effects: { learning: 8, fulfillment: 12 } },
    { id: "retrait", label: "Se protéger un moment", detail: "Mettre de la distance avant de décider.", cost: "Risque d'isolement", effects: { health: 5, relationships: -4, budgetStress: -2 } },
  ] },
  { id: "choice-14", age: 14, title: "Un regard sur l'avenir", prompt: "Une personne propose son aide. Qu'attend-on de ce lien ?", sensitivity: "standard", options: [
    { id: "mentor", label: "Un mentorat", detail: "Découvrir des métiers et des lieux inconnus.", cost: "Rendez-vous réguliers", effects: { learning: 12, relationships: 7 } },
    { id: "stage", label: "Une immersion", detail: "Tester un quotidien professionnel pour de vrai.", cost: "Temps scolaire", effects: { learning: 8, fulfillment: 7, relationships: 4 } },
  ] },
  { id: "choice-16", age: 16, title: "Le prochain pas", prompt: "Les options ne sont pas égales, mais plusieurs restent ouvertes.", sensitivity: "standard", options: [
    { id: "general", label: "Continuer les études", detail: "Garder du temps pour approfondir.", cost: "Revenus différés", effects: { learning: 15, budgetStress: 4 }, delayed: { atAge: 23, label: "La formation ouvre une porte", effects: { incomeMonthly: 260, fulfillment: 5 } } },
    { id: "alternance", label: "Choisir l'alternance", detail: "Apprendre en travaillant.", cost: "Fatigue et horaires", effects: { learning: 8, incomeMonthly: 180, health: -2 }, delayed: { atAge: 23, label: "Une expérience reconnue aide au départ", effects: { incomeMonthly: 180, relationships: 4 } } },
    { id: "apprentissage", label: "Entrer dans un métier", detail: "Un apprentissage très concret, tout de suite.", cost: "Moins de temps scolaire", effects: { incomeMonthly: 120, learning: 5, fulfillment: 4 }, delayed: { atAge: 23, label: "Une compétence devient un appui", effects: { incomeMonthly: 140, fulfillment: 3 } } },
  ] },
  { id: "choice-18", age: 18, title: "Quitter ou rester près des siens", prompt: "Quelle première autonomie semble possible ?", sensitivity: "standard", options: [
    { id: "partir", label: "Partir étudier", detail: "Un ailleurs, même avec peu de garanties.", cost: "Loyer et éloignement", effects: { learning: 10, relationships: -3, budgetStress: 10 } },
    { id: "rester", label: "Rester et travailler", detail: "S'appuyer sur le territoire connu.", cost: "Moins de mobilité", effects: { incomeMonthly: 220, relationships: 8, fulfillment: 2 } },
    { id: "service", label: "Prendre une année", detail: "Un temps pour travailler, aider, décider.", cost: "Parcours moins linéaire", effects: { fulfillment: 8, health: 5, incomeMonthly: 80 } },
  ] },
  { id: "choice-20", age: 20, title: "Le premier budget", prompt: "Une petite marge apparaît. Où va-t-elle ?", sensitivity: "standard", options: [
    { id: "securite", label: "Mettre de côté", detail: "Créer un coussin avant les projets.", cost: "Moins de plaisir immédiat", effects: { budgetStress: -12, debt: -80 } },
    { id: "formation", label: "Financer une compétence", detail: "Parier sur un apprentissage ciblé.", cost: "Dépense immédiate", effects: { learning: 12, budgetStress: 5 }, delayed: { atAge: 28, label: "La compétence facilite une mobilité", effects: { incomeMonthly: 230, fulfillment: 4 } } },
  ] },
  { id: "choice-23", age: 23, title: "Un logement à trouver", prompt: "Une chambre se libère. Quel compromis devient acceptable ?", sensitivity: "sensible", options: [
    { id: "colocation", label: "La colocation", detail: "Partager l'espace pour préserver le budget.", cost: "Moins d'intimité", effects: { budgetStress: -10, relationships: 8, housing: "colocation" } },
    { id: "studio", label: "Un petit studio", detail: "Un espace à soi, avec des fins de mois plus serrées.", cost: "Loyer élevé", effects: { budgetStress: 10, fulfillment: 8, housing: "studio" } },
    { id: "proches", label: "Rester chez des proches", detail: "Gagner du temps avant de partir.", cost: "Autonomie différée", effects: { budgetStress: -14, relationships: 5, housing: "chez des proches" } },
  ] },
  { id: "choice-25", age: 25, title: "Une proposition de travail", prompt: "Une opportunité demande un choix imparfait.", sensitivity: "standard", options: [
    { id: "stabilite", label: "Privilégier la stabilité", detail: "Un poste moins passionnant mais prévisible.", cost: "Moins de variété", effects: { incomeMonthly: 420, budgetStress: -8, employment: "emploi stable" } },
    { id: "risque", label: "Tenter l'aventure", detail: "Un projet plus fragile, mais plus proche de soi.", cost: "Revenus incertains", effects: { fulfillment: 14, relationships: 4, employment: "activité indépendante" }, delayed: { atAge: 31, label: "Le projet trouve son rythme", effects: { incomeMonthly: 300, learning: 8 } } },
  ] },
  { id: "choice-28", age: 28, title: "Un changement de ville", prompt: "Le travail et les liens tirent dans des directions différentes.", sensitivity: "standard", options: [
    { id: "mobilite", label: "Suivre le travail", detail: "Changer de décor pour saisir une opportunité.", cost: "Distance avec les proches", effects: { incomeMonthly: 360, learning: 8, relationships: -6 } },
    { id: "ancrage", label: "Rester ancré", detail: "Construire avec les ressources déjà présentes.", cost: "Opportunité laissée", effects: { relationships: 10, fulfillment: 6, budgetStress: -3 } },
  ] },
  { id: "choice-31", age: 31, title: "La semaine déborde", prompt: "Que protéger en premier quand tout devient urgent ?", sensitivity: "sensible", options: [
    { id: "sante", label: "Protéger sa santé", detail: "Réduire une charge et réapprendre le repos.", cost: "Moins de revenus", effects: { health: 14, fulfillment: 7, incomeMonthly: -120 } },
    { id: "carriere", label: "Tenir le cap professionnel", detail: "Accepter une période dense pour avancer.", cost: "Fatigue différée", effects: { incomeMonthly: 330, learning: 5, health: -8 }, delayed: { atAge: 37, label: "Le corps demande une pause", effects: { health: -10, fulfillment: -4 } } },
  ] },
  { id: "choice-34", age: 34, title: "Une place pour les autres", prompt: "Le temps disponible diminue. Que devient prioritaire ?", sensitivity: "standard", options: [
    { id: "proches", label: "Être présent pour les proches", detail: "Rendre le quotidien un peu plus tenable à plusieurs.", cost: "Moins de mobilité", effects: { relationships: 14, fulfillment: 7, incomeMonthly: -100 } },
    { id: "projet", label: "Garder un projet à soi", detail: "Préserver une chambre pour la curiosité personnelle.", cost: "Organisation exigeante", effects: { learning: 12, fulfillment: 11, health: 3 } },
  ] },
  { id: "choice-37", age: 37, title: "La bifurcation", prompt: "Un poste disparaît. La suite reste incertaine.", sensitivity: "sensible", options: [
    { id: "reconversion", label: "Se reconvertir", detail: "Investir du temps avant de retrouver un salaire.", cost: "Budget sous tension", effects: { learning: 15, incomeMonthly: -260, budgetStress: 12 }, delayed: { atAge: 43, label: "Une nouvelle compétence devient un métier", effects: { incomeMonthly: 520, fulfillment: 10, budgetStress: -10 } } },
    { id: "retour", label: "Reprendre un poste proche", detail: "Retrouver rapidement une sécurité relative.", cost: "Moins de choix", effects: { incomeMonthly: 210, budgetStress: -5, fulfillment: -3 } },
    { id: "collectif", label: "Créer à plusieurs", detail: "Mutualiser un risque et des ressources.", cost: "Revenus instables", effects: { relationships: 12, fulfillment: 12, incomeMonthly: 80 } },
  ] },
  { id: "choice-43", age: 43, title: "Le temps des responsabilités", prompt: "Une capacité nouvelle peut servir à quoi ?", sensitivity: "standard", options: [
    { id: "transmettre", label: "Transmettre", detail: "Aider quelqu'un à franchir une porte.", cost: "Du temps offert", effects: { relationships: 10, fulfillment: 10, learning: 5 } },
    { id: "avancer", label: "Prendre une responsabilité", detail: "Faire évoluer une organisation de l'intérieur.", cost: "Charge mentale", effects: { incomeMonthly: 480, learning: 7, health: -4 } },
  ] },
  { id: "choice-50", age: 50, title: "Changer de cadence", prompt: "Quelle ressource devient la plus importante ?", sensitivity: "sensible", options: [
    { id: "temps", label: "Reprendre du temps", detail: "Réduire la vitesse pour tenir la durée.", cost: "Revenus réduits", effects: { health: 15, fulfillment: 11, incomeMonthly: -180 } },
    { id: "revenu", label: "Maintenir le revenu", detail: "Continuer au même rythme pour sécuriser la suite.", cost: "Fatigue", effects: { incomeMonthly: 280, budgetStress: -6, health: -9 } },
  ] },
  { id: "choice-55", age: 55, title: "Préparer la suite", prompt: "Qu'est-ce qui mérite d'être organisé maintenant ?", sensitivity: "standard", options: [
    { id: "budget", label: "Le budget", detail: "Regarder les chiffres sans en faire un destin.", cost: "Renoncer à certains projets", effects: { budgetStress: -13, debt: -140 } },
    { id: "liens", label: "Les liens", detail: "Créer du temps disponible pour les autres.", cost: "Moins de confort", effects: { relationships: 15, fulfillment: 10 } },
  ] },
  { id: "choice-60", age: 60, title: "La retraite approche", prompt: "Quel rythme souhaite-t-on essayer ?", sensitivity: "standard", options: [
    { id: "engagement", label: "S'engager autrement", detail: "Mettre son expérience dans un collectif.", cost: "Du temps donné", effects: { relationships: 12, fulfillment: 13, health: 4 } },
    { id: "repos", label: "Choisir le repos", detail: "Réparer la fatigue accumulée.", cost: "Moins de stimulation", effects: { health: 14, fulfillment: 6, relationships: -2 } },
    { id: "transmission", label: "Transmettre son métier", detail: "Faire circuler des gestes et des repères.", cost: "Une présence régulière", effects: { learning: 7, relationships: 14, fulfillment: 10 } },
  ] },
  { id: "choice-65", age: 65, title: "Un rôle qui change", prompt: "Comment rester relié au monde ?", sensitivity: "standard", options: [
    { id: "quartier", label: "Le quartier", detail: "Une présence locale, concrète.", cost: "Déplacements", effects: { relationships: 12, health: 6 } },
    { id: "famille", label: "La famille choisie", detail: "Inventer des rendez-vous réguliers.", cost: "Disponibilité", effects: { relationships: 16, fulfillment: 9 } },
  ] },
  { id: "choice-70", age: 70, title: "Ce qui mérite d'être gardé", prompt: "Une journée libre se présente. Comment la remplir ?", sensitivity: "standard", options: [
    { id: "curiosite", label: "Apprendre encore", detail: "Une langue, une plante, un chemin inconnu.", cost: "Une attention régulière", effects: { learning: 10, fulfillment: 9 } },
    { id: "presence", label: "Être présent", detail: "Un repas, une conversation, une visite.", cost: "Du temps donné", effects: { relationships: 14, fulfillment: 8 } },
  ] },
];

export function getChoice(choiceId: string | null | undefined): Choice | null {
  return CHOICES.find((choice) => choice.id === choiceId) ?? null;
}

export function getAllChoices(): Choice[] {
  return CHOICES;
}

export function getLifeStage(age: number): Chapter {
  return chapterForAge(age);
}

function pickEvent(age: number, year: number, seed: string, choiceId?: string): LifeEvent {
  const available = EVENT_LIBRARY.filter((event) => age >= event.minAge && age <= event.maxAge);
  const fallback = EVENT_LIBRARY.filter((event) => event.minAge <= age && event.maxAge >= Math.max(0, age - 2));
  const pool = available.length > 0 ? available : fallback.length > 0 ? fallback : [EVENT_LIBRARY[0]];
  const rng = createSeededRng(`${seed}:event:${age}:${choiceId ?? "none"}`);
  const event = rng.pick(pool);
  return { ...event, age, year, chapter: chapterForAge(age), sourceId: "demo-synthetic", choiceId };
}

function applyEffects(state: PersonState, effects: ChoiceEffects): PersonState {
  return {
    ...state,
    health: clamp(state.health + (effects.health ?? 0)),
    fulfillment: clamp(state.fulfillment + (effects.fulfillment ?? 0)),
    learning: clamp(state.learning + (effects.learning ?? 0)),
    relationships: clamp(state.relationships + (effects.relationships ?? 0)),
    budgetStress: clamp(state.budgetStress + (effects.budgetStress ?? 0)),
    incomeMonthly: Math.max(0, Math.round(state.incomeMonthly + (effects.incomeMonthly ?? 0))),
    debt: Math.max(0, Math.round(state.debt + (effects.debt ?? 0))),
    education: effects.education ?? state.education,
    housing: effects.housing ?? state.housing,
    employment: effects.employment ?? state.employment,
  };
}

function mortalityRisk(age: number, health: number): number {
  if (age < 55) return 0.00015;
  if (age < 70) return 0.001 + (50 - health) * 0.00003;
  if (age < 80) return 0.004 + (50 - health) * 0.00008;
  if (age < 90) return 0.018 + (50 - health) * 0.00018;
  if (age < 100) return 0.075 + (50 - health) * 0.00025;
  return 0.32;
}

export function createInitialLife(seed: string, data: DemoData): PersonState {
  const rng = createSeededRng(`birth:${seed}`);
  const territory = weightedPick(data.birthDistribution.territories, rng).territory;
  const household = rng.pick(["deux adultes et enfant", "parent seul et enfant", "foyer élargi"]);
  const socialOrigin = rng.pick(["ressources très contraintes", "ressources intermédiaires", "ressources plutôt stables"]);
  const housing = rng.pick(["logement social fictif", "location privée fictive", "hébergement familial fictif"]);
  const event = pickEvent(0, BASE_YEAR, seed);
  return {
    version: VERSION,
    seed,
    age: 0,
    year: BASE_YEAR,
    alive: true,
    territory,
    household,
    socialOrigin,
    housing,
    education: "à construire",
    employment: "sans emploi",
    incomeMonthly: 0,
    debt: 0,
    health: 68,
    fulfillment: 54,
    learning: 48,
    relationships: 52,
    budgetStress: 32,
    pendingChoiceId: null,
    pendingEffects: [],
    decisions: [],
    timeline: [event],
    journal: [event.body],
    deathAge: null,
    modeLabel: "Démo synthétique — données fictives",
  };
}

export function resolveChoice(state: PersonState, choiceId: string): PersonState {
  return chooseOption(state, choiceId);
}

export function chooseOption(state: PersonState, optionId: string): PersonState {
  const choice = getChoice(state.pendingChoiceId);
  if (!choice) return state;
  const option = choice.options.find((candidate) => candidate.id === optionId);
  if (!option) return state;
  const withEffects = applyEffects({ ...state, pendingChoiceId: null, decisions: [...state.decisions, `${choice.id}:${option.id}`] }, option.effects);
  return {
    ...withEffects,
    pendingEffects: option.delayed ? [...withEffects.pendingEffects, option.delayed] : withEffects.pendingEffects,
    journal: [...withEffects.journal, `Choix : ${option.label}. ${option.detail}`],
  };
}

export function stepYear(state: PersonState): PersonState {
  if (!state.alive || state.pendingChoiceId) return state;
  const nextAge = state.age + 1;
  const nextYear = state.year + 1;
  let next = { ...state, age: nextAge, year: nextYear };
  const due = next.pendingEffects.filter((effect) => effect.atAge === nextAge);
  for (const effect of due) {
    next = applyEffects(next, effect.effects);
    next = { ...next, journal: [...next.journal, effect.label] };
  }
  next = { ...next, pendingEffects: next.pendingEffects.filter((effect) => effect.atAge !== nextAge) };

  const rng = createSeededRng(`${state.seed}:mortality:${nextAge}:${state.decisions.join("|")}`);
  const died = nextAge >= 102 || rng.next() < mortalityRisk(nextAge, next.health);
  if (died) {
    const event: LifeEvent = { id: "death", age: nextAge, year: nextYear, chapter: "fin-de-vie", title: "La vie s'arrête ici", body: "La simulation arrive à son terme. La mort n'est pas une note ni une récompense : seulement une limite de ce récit fictif.", kind: "fin", sensitivity: "sensible", assumptionId: "mortality-demo-hazard", sourceId: "demo-synthetic" };
    return { ...next, alive: false, deathAge: nextAge, pendingChoiceId: null, timeline: [...next.timeline, event], journal: [...next.journal, event.body] };
  }

  const event = pickEvent(nextAge, nextYear, state.seed, state.decisions.at(-1));
  const baselineDrift = nextAge > 55 ? -1 : nextAge < 18 ? 1 : 0;
  const withDrift = { ...next, health: clamp(next.health + baselineDrift), fulfillment: clamp(next.fulfillment + (nextAge % 5 === 0 ? 1 : 0)) };
  const choice = CHOICES.find((candidate) => candidate.age === nextAge);
  const enriched = { ...withDrift, pendingChoiceId: choice?.id ?? null, timeline: [...withDrift.timeline, event], journal: [...withDrift.journal, event.body] };
  return enriched;
}

export function advanceUntilChoiceOrEnd(state: PersonState, maxYears = 12): PersonState {
  if (!state.alive || state.pendingChoiceId || maxYears <= 0) return state;
  let next = state;
  let years = 0;
  while (next.alive && !next.pendingChoiceId && years < maxYears) {
    next = stepYear(next);
    years += 1;
  }
  return next;
}

export function continueAfterChoice(state: PersonState): PersonState {
  return state.pendingChoiceId ? state : stepYear(state);
}

export function deriveSurvivalCurve(state: PersonState): Array<{ age: number; alive: boolean }> {
  return Array.from({ length: state.age + 1 }, (_, age) => ({ age, alive: state.deathAge === null || age < state.deathAge }));
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function formatAge(age: number): string {
  return `${age} an${age > 1 ? "s" : ""}`;
}
