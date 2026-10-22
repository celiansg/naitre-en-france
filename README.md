# Naître en France — Une vie parmi d'autres

Prototype jouable mobile-first d'une simulation de vie narrative. Le projet est une œuvre originale : il ne traduit ni ne réutilise le code, les textes ou les assets d'un service tiers.

## Statut réel

Le prototype livre une verticale complète : naissance seedée, certificat de départ, progression année par année ou jusqu'à la prochaine bifurcation, choix à plusieurs options, effets différés, événements heureux et difficiles, journal, chronologie, courbe de survie, bilan partageable, sauvegarde locale et pages de sources/méthode/confidentialité/accessibilité.

Le mode actuel est `SYNTHETIC_DEMO`. Les pondérations, territoires, foyers, revenus, événements et risques sont fictifs. Ils sont signalés dans l'interface et ne doivent pas être présentés comme des statistiques françaises.

## Lancer

```powershell
pnpm install --ignore-scripts
pnpm dev
```

Puis ouvrir `http://localhost:3000`.

Si l'environnement pnpm exige une approbation des scripts natifs et bloque sur `ERR_PNPM_IGNORED_BUILDS`, approuver `esbuild` et `unrs-resolver` une fois avec `pnpm approve-builds`, puis relancer l'installation. Dans cet environnement de travail, les binaires directs listés ci-dessous ont été utilisés avec succès.

Vérifications :

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

Sur cet environnement, les binaires directs équivalents sont aussi utilisables : `node_modules/.bin/eslint.cmd .`, `node_modules/.bin/tsc.cmd --noEmit`, `node_modules/.bin/vitest.cmd run`, `node_modules/.bin/next.cmd build` et `node_modules/.bin/playwright.cmd test`.

## Architecture

- `app/` — Next.js App Router, routes et expérience interactive.
- `packages/engine/` — moteur TypeScript pur : PRNG seedé, `stepYear`, choix, mortalité annuelle et courbe.
- `packages/data/` — manifeste, provenance, schémas Zod et dataset de démonstration.
- `packages/ui/` — primitives visuelles partagées.
- `data/demo.synthetic.json` — squelette fourni par le kit, conservé comme exemple explicitement fictif.
- `public/kit/assets/` — assets originaux du ZIP fourni.

## Limite importante

La France réelle n'est pas encore branchée. Avant publication, il faut importer et vérifier les données INSEE/DREES/DEPP/DARES/INED et les sources historiques, avec millésime, champ, dénominateur, couverture géographique, licence, valeurs manquantes et ruptures de séries. Voir [DATA_METHODOLOGY.md](DATA_METHODOLOGY.md), [SOURCES.md](SOURCES.md) et [ROADMAP.md](ROADMAP.md).
