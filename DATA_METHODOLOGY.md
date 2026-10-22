# Méthodologie des données

## Trois catégories toujours séparées

1. **Fait statistique observé** : valeur importée d'une source identifiée, avec champ, unité, millésime, géographie et dénominateur.
2. **Hypothèse de modélisation** : règle nécessaire au moteur quand une observation ne suffit pas à simuler une trajectoire. Elle est versionnée et affichée comme hypothèse.
3. **Événement fictif** : scène narrative créée pour donner une forme lisible à une année. Elle ne prétend pas être une observation.

Le dataset chargé par le prototype est entièrement dans la troisième catégorie ou dans l'hypothèse de démonstration. Il porte le mode `SYNTHETIC_DEMO`.

## Naissance

La version de démonstration tire un territoire avec une pondération fictive. La version France devra calculer :

`poids département, année = naissances vivantes du département / total des naissances vivantes du millésime retenu`

La couverture devra inclure métropole et DROM, avec les exclusions et ruptures de séries visibles. Une distribution uniforme par département est interdite.

## Pauvreté et foyer

Le taux de pauvreté de l'ensemble de la population ne peut pas être utilisé comme probabilité de naître pauvre. Le pipeline devra sélectionner une statistique compatible avec les familles avec enfants ou les ménages concernés et conserver le conditionnement exact dans le manifeste.

## Moteur

`createInitialLife(seed, data)` et `stepYear(state)` sont déterministes. Les composants React n'effectuent aucun tirage. Une même graine, la même version de données et les mêmes choix reproduisent la même vie.

La mortalité utilise un risque annuel de démonstration. Le prototype n'attribue pas de cause médicale. Une future version devra charger des tables de mortalité par âge, sexe et période lorsque la source et le niveau de preuve sont compatibles.

## Calibration à faire

Avant d'utiliser des données françaises :

- valider les schémas CSV/JSON avec Zod ;
- produire un rapport Monte Carlo (au moins 100 000 naissances lorsque la précision le justifie) ;
- comparer les marges simulées et observées ;
- afficher l'incertitude et les valeurs manquantes ;
- empêcher le build de production si un champ obligatoire est absent.
