import { z } from "zod";
import type { DemoData, DatasetManifest } from "@naitre/engine";

export const demoManifestSchema = z.object({
  id: z.string(),
  version: z.string(),
  mode: z.enum(["SYNTHETIC_DEMO", "VALIDATED_FRANCE"]),
  generatedAt: z.string(),
  coverage: z.string(),
  exclusions: z.array(z.string()),
  sources: z.array(z.object({
    id: z.string(),
    label: z.string(),
    url: z.string().url(),
    publisher: z.string(),
    vintage: z.string(),
    field: z.string(),
    denominator: z.string(),
    method: z.string(),
    license: z.string(),
    uncertainty: z.string(),
    status: z.enum(["a-verifier", "synthetique", "observe"]),
  })),
});

const manifest: DatasetManifest = {
  id: "naitre-en-france-demo",
  version: "2026.10-demo.1",
  mode: "SYNTHETIC_DEMO",
  generatedAt: "2026-10-22",
  coverage: "Territoires fictifs — couverture de démonstration uniquement",
  exclusions: [
    "Aucune statistique française validée n'est branchée dans ce prototype.",
    "Les départements, revenus, foyers et risques sont fictifs et ne décrivent pas une personne réelle.",
    "Les événements historiques n'ont pas encore d'impact économique chiffré documenté.",
  ],
  sources: [
    {
      id: "demo-synthetic",
      label: "Jeu de données de démonstration",
      url: "https://github.com/",
      publisher: "Naître en France — prototype",
      vintage: "2026-10",
      field: "Tous les tirages et paramètres de jeu",
      denominator: "Aucun — valeurs synthétiques",
      method: "Paramètres fictifs, tirage seedé et moteur déterministe",
      license: "Prototype — données à remplacer avant publication",
      uncertainty: "Ne pas interpréter comme une estimation de la France",
      status: "synthetique",
    },
    {
      id: "insee-naissances-a-verifier",
      label: "INSEE — bilan démographique et naissances",
      url: "https://www.insee.fr/fr/statistiques",
      publisher: "INSEE",
      vintage: "À vérifier avant intégration",
      field: "Naissances vivantes par département et année",
      denominator: "Total des naissances vivantes du millésime retenu",
      method: "Import CSV/JSON, contrôle de couverture métropole + DROM",
      license: "À vérifier sur la source",
      uncertainty: "Ruptures de séries et millésime à documenter",
      status: "a-verifier",
    },
    {
      id: "insee-poverty-a-verifier",
      label: "INSEE — pauvreté et niveau de vie",
      url: "https://www.insee.fr/fr/statistiques",
      publisher: "INSEE",
      vintage: "À vérifier avant intégration",
      field: "Familles avec enfants / ménages compatibles",
      denominator: "Conditionnement compatible avec la naissance",
      method: "Ne pas utiliser le taux de pauvreté de toute la population",
      license: "À vérifier sur la source",
      uncertainty: "Conditionnement et disponibilité infra-nationale à documenter",
      status: "a-verifier",
    },
    {
      id: "drees-sante-a-verifier",
      label: "DREES — santé et protection sociale",
      url: "https://drees.solidarites-sante.gouv.fr/",
      publisher: "DREES",
      vintage: "À vérifier avant intégration",
      field: "Indicateurs de santé et de recours aux soins",
      denominator: "Selon chaque indicateur",
      method: "Revue humaine obligatoire avant paramétrage",
      license: "À vérifier sur la source",
      uncertainty: "Ne pas inférer de diagnostic individuel",
      status: "a-verifier",
    },
    {
      id: "depp-education-a-verifier",
      label: "DEPP — école et parcours",
      url: "https://www.education.gouv.fr/depp",
      publisher: "DEPP",
      vintage: "À vérifier avant intégration",
      field: "Parcours scolaires et orientation",
      denominator: "Selon le champ de chaque publication",
      method: "Import documenté avec valeurs manquantes explicites",
      license: "À vérifier sur la source",
      uncertainty: "La simulation ne prédit pas un destin individuel",
      status: "a-verifier",
    },
  ],
};

export const demoData: DemoData = {
  manifest,
  birthDistribution: {
    basis: "Démonstration : pondération fictive, à remplacer par les naissances vivantes par département et année.",
    denominator: "Aucun dénominateur français utilisé dans ce prototype.",
    territories: [
      { territory: "Territoire A — démo", weight: 4 },
      { territory: "Territoire B — démo", weight: 3 },
      { territory: "Territoire C — démo", weight: 2 },
      { territory: "Territoire D — démo", weight: 1 },
    ],
  },
};

export function validateManifest(input: unknown): DatasetManifest {
  return demoManifestSchema.parse(input) as DatasetManifest;
}

export { manifest };
