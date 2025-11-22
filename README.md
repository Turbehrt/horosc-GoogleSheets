# Horosc for Google Sheets

[![en](https://img.shields.io/badge/lang-en-red.svg)](/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](/README.fr.md)

En route for version 2 (readme not yet updated)

## Project background

John D. North's book, *Horoscopes and History*, London: Warburg Institute, 1986, published in an appendix (appendix 4, pp. 197-218) the Pascal for MS-DOS code of an application entitled **HOROSC** and designed to calculate and check the domification of a horoscope using the seven main historical methods.

Due to the obsolescence of the Pascal language, this application became very difficult to access. Launched in 2021, this project ports the code to Google Script for use in Google Sheets.

## General principle

The programme written by John D. North offered two approaches:

### Method A

Knowing:
*    the value of the obliquity of the ecliptic,
*    the geographical latitude of the observation location,
*    and the ecliptic longitude of the Ascendant

the application provides:

* the theoretical calculation of the sexagesimal longitudes and/or right ascensions of the first 6 houses (the next 6 are inferred by symmetry) according to the 7 historical house systems

This method is reproduced here by the Google Sheets formula `computeLongitudesAllMethodsLatitude(obliquity of the ecliptic, longitude of the ascendant, geographical latitude, number of lines)`.
It produces two tables, one for longitudes and one for right ascensions, separated by the number of lines entered.

### Method B

Knowing:
*    the value of the obliquity of the ecliptic,
*    the longitudes of the first 6 houses (transcribed from a historical source),
*    and a margin of error or rounding

the application provides:
*    a theoretical calculation of the latitude of the observation site (with an interval corresponding to the margin of error, applied to the right ascension of the ascendant or the midheaven)
*    a comparison with the theoretical longitudes (calculated considering only the ascendant and the midheaven) according to the seven historical house systems, with a quality coefficient (generally allowing the method actually used to be identified)

This method is reproduced here by the Google Sheets formula `computeLongitudesAllMethodsLongitude(obliquity of the ecliptic, margin of error, longitudes of the 6 houses, number of lines)`.
It produces four tables: theoretical longitudes, quality coefficients, right ascensions and geographical latitude interval.

### Google Sheets implementation

A model spreadsheet is available: https://docs.google.com/spreadsheets/d/1UWJM_OhMITBi0EqJBSEJliBTDF_XL4UtUA6idv0KYEA/copy (read-only: to be copied and modified in a personal Google space).

> [!NOTE]
> All numbers (inputs and results, except for quality coefficients) are expressed in degrees in sexagesimal form. One string is expected, with any separators, for instance: 187.12'04, 187°12'04'', 187d 12m).

## Calculation methods and intermediate functions

### Sequences

The two methods perform the calculations as follows:

* Method A (`computeLongitudesAllMethodsLatitude`)
  - conversion of inputs to radians
  - calculation of the right ascension of the ascendant
  - calculation of the right ascension of the *Imum Caeli* (using the ascending difference)
  - calculation of the longitude of the *Imum Caeli*
  - calling each method and converting the results to degrees (sexagesimal)
  - display of results

* Method B (`computeLongitudesAllMethodsLongitude`)
  - conversion of inputs to radians
  - extraction of the longitude of the ascendant and the *Imum Caeli*
  - calculation of the right ascensions of the ascendant and the *Imum Caeli*
  - calculation of the theoretical latitude of the observation site
  - calling each method and converting the results to degrees (sexagesimal)
  - calculation of quality coefficients (in radians)
  - conversion of the margin of error into radians and calculation of a latitude interval:
    + at the centre, the theoretical value (based on the ascendant and the *Imum Caeli* provided)
    + vertically, the values in case of error/approximation of the right ascension of the ascendant
    + horizontally, the values in case of error/approximation of the right ascension of the sky background
  - display of results

### Intermediate functions

Each of the two main formulas calls intermediate functions, which are not recommended for direct use in the spreadsheet in order to limit latency.
* `sexagesimalToRadian`: converts a sexagesimal number in degrees to radians
* `radianToSexagesimal`: converts a number in radians to degrees (sexagesimal form)
* `moduloTwoPI`
* `eclipticToEquator`: converts a longitude into right ascension (given the obliquity of the ecliptic)
* `equatorToEcliptic`: converts a right ascension into longitude (given the obliquity of the ecliptic)
* domification functions (`method0`, `method1`, `method2`, `method3`, `method4`, `method5`, `method6`): for each method, given the obliquity of the ecliptic, the geographical latitude of the observation location, the longitude and right ascension of the ascendant, the longitude and right ascension of the *Imum Caeli* (cusp of the 4th house, opposite the Midheaven), returns the set of longitudes and right ascensions of the cusps of the first 6 houses. Method 0 uses a convergence function, `converge`, to emulate a graphical approach on the astrolabe.
* `retrieveLatitude`: calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the right ascensions of the ascendant and the *Imum Caeli* (IMC).
* `qualities`: from two sets of longitudes (provided by a historical source and calculated theoretically) <ins>**expressed in radians**</ins>, calculates the absolute difference and produces an overall quality coefficient (average of the absolute differences for houses 2, 3, 5 and 6).


## Differences from North's initial programme

(ongoing)

## Example data

(ongoing)
