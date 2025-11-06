# Horosc pour Google Sheets

[![en](https://img.shields.io/badge/lang-en-red.svg)](/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](/README.fr.md)

## Contexte du projet
L'ouvrage de John D. North, *Horoscopes and History*, Londres : Warburg Institute, 1986, publiait en annexe (appendix 4 p. 197-218) le code d’un programme en Pascal pour MS-DOS, intitulé **HOROSC** et visant à calculer et contrôler la domification d’un horoscope en suivant les 7 principales méthodes historiques.

En raison de l’obsolescence du langage Pascal, ce programme devenait très difficilement accessible. Initié en 2021, le présent projet porte le code en Google Script pour un usage dans Google Sheets.

## Principe général
Le programme écrit par John D. North propose deux approches :

### Méthode A
En connaissant :
*	la valeur de l’obliquité de l’écliptique,
*	la latitude géographique du lieu d’observation,
*	et la longitude écliptique de l’Ascendant

le programe fournit :
* le calcul théorique des longitudes et/ou ascensions droites sexagésimales des 6 premières maisons (les 6 suivantes sont induites par symétrie) selon les 7 méthodes de domification historique

Cette méthode est restituée ici par la formule Google Sheets `computeLongitudesAllMethodsLatitude(obliquité de l’écliptique, longitude de l’ascendant, latitude géographique, nombre de lignes)`.
Elle produit deux tableaux, respectivement pour les longitudes et les ascensions droites, séparés par le nombre de lignes renseigné.

### Méthode B
En connaissant :
*	la valeur de l’obliquité de l’écliptique,
*	les longitudes des 6 premières maisons (transcrites d’une source historique),
*	et une marge d’erreur ou d’arrondi

le programe fournit :
*	un calcul théorique de la latitude du lieu d’observation (avec un intervalle correspondant à la marge d’erreur, appliquée à l’ascension droite de l’ascendant ou du milieu du ciel)
*	une comparaison avec les longitudes théoriques (calculées en considérant justes l'ascendant et le milieu du ciel) selon les 7 méthodes de domification historique, avec coefficient de qualité (permettant généralement d’identifier la méthode effectivement utilisée)

Cette méthode est restituée ici par la formule Google Sheets `computeLongitudesAllMethodsLongitude(obliquité de l’écliptique, marge d’erreur, longitudes des 6 maisons, nombre de lignes)`.
Elle produit quatre tableaux : longitudes théoriques, coefficients de qualité, ascensions droites et intervalle de latitude géographique.

### Implémentation Google Sheets
Une feuille de calcul modèle est disponible : https://docs.google.com/spreadsheets/d/1dgQrJaP_dA9V-9qrfeBkJBjlTtezqR3PmNLpIvNoAyw/copy (en lecture seule : à copier et à modifier dans un espace Google personnel).

> [!NOTE]
> Tous les nombres (entrées et résultats, à l'exception des coefficients de qualité) sont exprimés en degrés sous forme sexagésimale (ex : 187.12’04 pour 187°12’04’’).

## Méthode de calcul
Chacune des deux formules principales appelle des fonctions intermédiaires, qu’il est déconseillé d’utiliser directement dans la feuille de calcul pour limiter le temps de latence.

*	`sexagesimalToRadian` : convertit un nombre sexagésimal en radians
*	`radianToSexagesimal` : convertit un nombre en radians en degrés (forme sexagésimale)
*	`moduloTwoPI`
*	`eclipticToEquator` : convertit une longitude en ascension droite (étant connue l’obliquité de l’écliptique)
*	`equatorToEcliptic` : convertit une ascension droite en longitude (étant connue l’obliquité de l’écliptique)
*	fonctions de domification (`method0`, `method1`, `method2`, `method3`, `method4`, `method5`, `method6`) : pour chaque méthode, étant donnés l’obliquité de l’écliptique, la latitude géographique du lieu d’observation, la longitude et l’ascension droite de l’ascendant , la longitude et l’ascension droite du fond du ciel (*Imum Caeli*, pointe de la maison IV), retourne l’ensemble des longitudes et ascensions droites des pointes des 6 premières maisons. La méthode 0 utilise une fonction de convergence, `converge`, pour émuler une approche graphique sur l’astrolabe.
* `retrieveLatitude` : calcule la latitude théorique du lieu d’observation à partir de l’obliquité de l’écliptique, et des ascensions droites de l’ascendant et du fond du ciel (IMC).
*	`qualities` : à partir de deux ensembles de longitudes (fournies par une source historique et calculées théoriquement) <ins>**exprimées en radians**</ins>, calcule la différence absolue, et produit un coefficient de qualité global (moyenne des différences absolues pour les maisons 2, 3, 5 et 6).

Les deux méthodes enchaînent les calculs comme suit :
* Méthode A (`computeLongitudesAllMethodsLatitude`)
  - conversion des entrées en radians
  - calcul de l’ascension droite de l’ascendant
  - calcul de l’ascension droite du fond du ciel (en utilisant la différence ascensionnelle)
  - calcul de la longitude du fond du ciel
  - appel de chaque méthode et conversion des résultats en degrés (sexagésimaux)
  - affichage des résultats

* Méthode B (`computeLongitudesAllMethodsLongitude`)
  - conversion des entrées en radians
  - extraction de la longitude de l’ascendant et du fond du ciel
  - calcul des ascensions droites de l’ascendant et du fond du ciel
  - calcul de la latitude théorique du lieu d’observation
  - appel de chaque méthode et conversion des résultats en degrés (sexagésimaux)
  - calcul des coefficients de qualité (en radians)
  - conversion de la marge d’erreurs en radians et calcul d’un intervalle de latitudes :
    + au centre la valeur théorique (d’après l’ascendant et le fond du ciel fournis)
    + verticalement, les valeurs en cas d’erreur/approximation de l’ascension droite de l’ascendant
    + horizontalement, les valeurs en cas d’erreur/approximation de l’ascension droite du fond du ciel
  - affichage des résultats
