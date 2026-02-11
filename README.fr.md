# Horosc pour Google Sheets

[![en](https://img.shields.io/badge/lang-en-red.svg)](/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](/README.fr.md)

Version 2 (2025)

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
*	une comparaison avec les longitudes théoriques (calculées en considérant exacts l'ascendant et le milieu du ciel) selon les 7 méthodes de domification historique, avec coefficient de qualité (permettant généralement d’identifier la méthode effectivement utilisée)

Cette méthode est restituée ici par la formule Google Sheets `computeLongitudesAllMethodsLongitude(obliquité de l’écliptique, marge d’erreur, longitudes des 6 maisons, nombre de lignes)`.
Elle produit quatre tableaux : longitudes théoriques, coefficients de qualité, ascensions droites et intervalle de latitude géographique.

### Implémentation Google Sheets
Une feuille de calcul modèle est disponible : _(à compléter, voir les versions antérieures)_ (en lecture seule : à copier et à modifier dans un espace Google personnel).

> [!NOTE]
> Tous les nombres (entrées et résultats, à l'exception des coefficients de qualité, mais y compris les ascensions droites) sont exprimés en degrés sous forme sexagésimale. Les résultats réutilisent, dans la mesure du possible, les séparateurs fournis en entrée (ex : 187.12'04, 187°12'04'', 187d 12m).

## Méthodes de calcul et fonctions intermédiaires

### Séquences de calcul

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

### Fonctions intermédiaires
Depuis la version 2, le code utilise des fonctions intermédiaires similaires à celles d'[Horosc for Excel](https://github.com/Turbehrt/horosc-Excel). Leur usage individuel dans la feuille de calcul est cependant déconseillé en raison du temps d'exécution.

* **Calcul d'angles**
  + `moduloRange`, `moduloTwoPI`
  + `sexagesimalFormat` : extrait les séparateurs utilisés en entrée
  +	`sexagesimalToRadian` : convertit un nombre sexagésimal en radians
  +	`radianToSexagesimal` : convertit un nombre en radians en degrés, en utilisant un ensemble de séparateurs (facultatif)
* **Coordonnées célestes**
  +	`eclipticToEquator(obliquity, longitude)` : convertit une longitude en ascension droite (étant connue l’obliquité de l’écliptique)
  +	`equatorToEcliptic(obliquity, rightAscension)` : convertit une ascension droite en longitude (étant connue l’obliquité de l’écliptique)
  +	`retrieveLatitude(obliquity, rightASC, rightIMC)` (radians), `retrieveLatitudeSexagesimal` (degrés) : calcule la latitude théorique du lieu d’observation à partir de l’obliquité de l’écliptique, et des ascensions droites de l’ascendant et du fond du ciel (IMC).
  +	`retrieveLatitudeFromLong(obliquity, longASC, longIMC)` (radians), `retrieveLatitudeFromLongSexagesimal` (degrés) : calcule la latitude théorique du lieu d’observation à partir de l’obliquité de l’écliptique, et des longitudes de l’ascendant et du fond du ciel (IMC).
  +	`retrieveLatitudeRange(obliquity, longASC, longIMC, error, direction)` (radians), `retrieveLatitudeRangeSexagesimal` (degrés) : application d'une marge d'erreur (`error`) dans le calcul de la latitude, en suivant la croix proposée par North
    * `direction = 0` : aucune erreur (identique à `retrieveLatitude`)
    * `direction = 1` (haut) ou `direction = 2` (bas) : marge d'erreur appliquée à la longitude de l'ascendant
    * `direction = 3` (gauche) ou `direction = 4` (droite) : marge d'erreur appliquée à la longitude du fond du ciel

> [!IMPORTANT]
> Depuis la version 2, la formule `retrieveLatitudeRange` corrige des incohérences constatées dans le code PASCAL du programme initial, et ne retourne donc pas les mêmes résultats (que le programme en PASCAL ou que la version 1 de Horosc for Google Sheets). Plus de détails [ci-dessous](#diff%C3%A9rences-avec-le-programme-initial-de-j-d-north).
    
* **Domification** : pour chaque méthode de modification, les fonctions `method0(obliquity, geoLatitude, rightASC, rightIMC, houseIndex, getRA)` à `method6` renvoient l'ascension droite (`getRA = true`) ou la longitude (`getRA = false`) de la pointe d'une maison (`houseIndex` de 1 à 6) à partir de l'obliquité de l'écliptique (`obliquity`), de la latitude géographique du lieu d’observation (`geoLatitude`) et de l'ascension droite de l'ascendant et du fond du ciel (`rightASC`, `right IMC`). Entrées et résultats en radians.
  + `method0` : méthode des lignes horaires (_Hour Lines method, fixed boundaries_). Les pointes sont les intersections de l'écliptique avec l'horizon, le cercle méridien et les lignes des heures inégales (paires). Cette méthode est généralement graphique, à l'aide d'un astrolabe, ici émulé avec une fonction de convergence (`houseIndex`).
  + `method1` : méthode Standard, dite d'Alcabitius (_Standard method_). Division uniforme des secteurs cardinaux de l'équateur.
  + `method2` : méthode à double longitude (_Dual longitude method_). Division uniforme des secteurs cardinaux de l'écliptique.
  + `method3` : méthode du Premier Vertical (_Prime Vertical method, fixed boundaries_). Division uniforme du Premier Vertical.
  + `method4` : méthode équatoriale (_Equatorial method, fixed boundaries_). Division uniforme de l'équateur sur la sphère locale.
  + `method5` : méthode équatoriale à limites mobiles (_Equatorial method, moving boundaries_). Division uniforme de l'équateur sur la sphère céleste.
  + `method6` : méthode à longitude simple (_Single Longitude Method_). Division uniforme de l'écliptique.
* **Fonctions globales**, permettant d'enchaîner les conversions en fonction des entrées disponibles
  + `computeCuspWithMethodInRadian(obliquity, geoLatitude, rightASC, longASC, rightIMC, longIMC, houseIndex, method, getRA)` : appelle n'importe quelle méthode (`method`), à partir des ascensions droite et longitudes de l'ascendant et du fond du ciel (en radians)
  + `computeCuspFromLatitudeInRadian(obliquity, geoLatitude, longASC, houseIndex, method, getRA)` : appelle n'importe quelle méthode, à partir de la longitude de l'ascendant et de la latitude géographique d'observation (en radians)
  + `computeCuspFromLatitudeInSexagesimal` :  appelle n'importe quelle méthode, à partir de la longitude de l'ascendant et de la latitude géographique d'observation (en degrés)
  + `computeCuspFromLongitudeInRadian(obliquity, longASC, longIMC, houseIndex, method, getRA)` : appelle n'importe quelle méthode, à partir des longitudes de l'ascendant et du fond du ciel (en radians)
  + `computeCuspFromLongitudeInSexagesimal` : appelle n'importe quelle méthode, à partir des longitudes de l'ascendant et du fond du ciel (en degrés)
* **Coefficients de qualité**
  + `qualityCoefficientRadian(observedLongitude, computedLongitude)`, `qualityCoefficientDegree` : les coefficients de qualité correspondent à la différence entre une longitude observée (transcrite d'une source historique) et une longitude calculée.

### Différences avec le programme initial de J. D. North

Plusieurs choix algorithmiques du programme en Pascal, en particulier pour la restitution des latitudes, ont paru surprenants et n'ont pas été transposés à l'identique.

* le calcul de la latitude théorique du lieu d'observation suppose que l'observation se fait toujours dans l'hémisphère Nord en appliquant une valeur absolue. **Ce comportement est préservé par défaut dans le présent programme.** A titre expérimental, un argument facultatif `methNorth` a été introduit dans la fonction `retrieveLatitude` : si `methNorth = false`, la latitude est modulée entre -&pi;/2 et &pi;/2 radians. Cet algorithme n'a pas encore été testé ; il n'est pas recommandé d'y recourir pour l'instant (risque de résultat faux et/ou incohérent avec d'autres fonctions).

* la composition initiale de la croix des latitudes nous a paru incohérente. Les fonctions `FOI` et `FIO` du code Pascal, correspondant à nos directions 1 et 2 de `retrieveLatitudeRange` (marge d'erreur appliquée à l'ascendant) retiraient également la marge d'erreur à l'ascension droite du fond du ciel, ce qui n'est pas cohérent avec la logique de calcul. **La correction est appliquée par défaut depuis la version 2 du présent programme.** Il reste cependant possible de calculer manuellement FOI : `retrieveLatitude(obliquity, rightASC - error, rightIMC - error)` et FIO : `retrieveLatitude(obliquity, rightASC + error, rightIMC - error)`.
