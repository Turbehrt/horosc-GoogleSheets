# Horosc for Google Sheets

[![en](https://img.shields.io/badge/lang-en-red.svg)](/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](/README.fr.md)

Version 2 (2026)

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

This method is reproduced here by the Google Sheets formula `computeLongitudesAllMethodsLatitude(obliquity of the ecliptic, geographical latitude, longitude of the ascendant, number of lines)`.
It produces two tables, one for longitudes and one for right ascensions, separated by the number of lines entered.

### Method B

Knowing:
*    the value of the obliquity of the ecliptic,
*    the longitudes of the first 6 houses (transcribed from a historical source),
*    and a margin of error or rounding

the application provides:
*    a theoretical calculation of the latitude of the observation site (with an interval corresponding to the margin of error, applied to the right ascension of the ascendant or midheaven)
*    a comparison with the theoretical longitudes (calculated considering only the ascendant and the midheaven) according to the seven historical house systems, with a quality coefficient (generally allowing the method actually used to be identified)

This method is reproduced here by the Google Sheets formula `computeLongitudesAllMethodsLongitude(obliquity of the ecliptic, longitudes of the 6 houses, margin of error, number of lines)`.
It produces four tables: theoretical longitudes, quality coefficients, right ascensions and geographical latitude interval.

### Google Sheets implementation

A model spreadsheet is available: https://docs.google.com/spreadsheets/d/1loehBW0RA_WLqDHOZ3gs6c-r961kz8pjbS_jsl9doSQ/copy (read-only: to be copied and modified in a personal Google space).

> [!NOTE]
> All numbers (inputs and results, except for quality coefficients, but including right ascensions) are expressed in degrees in sexagesimal form. Separators provided in the input, if consistant, are reused in the output (ex: 187.12'04, 187°12'04'', 187d 12m).

## Calculation methods and intermediate functions

### Sequences

The two methods perform the calculations as follows:

* Method A (`computeLongitudesAllMethodsLatitude`)
  - conversion of inputs to radians
  - calculation of the right ascension of the ascendant
  - calculation of the right ascension of the *Imum Coeli* (using the ascensional difference)
  - calculation of the longitude of the *Imum Coeli*
  - calling each method and converting the results to degrees (sexagesimal)
  - display of results

* Method B (`computeLongitudesAllMethodsLongitude`)
  - conversion of inputs to radians
  - extraction of the longitude of the ascendant and *Imum Coeli*
  - calculation of the right ascensions of the ascendant and *Imum Coeli*
  - calculation of the theoretical latitude of the observation site
  - calling each method and converting the results to (sexagesimal) degrees
  - calculation of quality coefficients (in radians)
  - conversion of the margin of error into radians and calculation of a latitude interval:
    + at the centre, the theoretical value (based on the ascendant and *Imum Coeli* provided)
    + vertically, the values in case of error/approximation of the right ascension of the ascendant
    + horizontally, the values in case of error/approximation of the right ascension of the *Imum Coeli*
  - display of results

### Intermediate functions

Since version 2, the code uses intermediate functions similar to those in [Horosc for Excel](https://github.com/Turbehrt/horosc-Excel). However, their individual use within a spreadsheet is discouraged due to execution time.

* **Angle calculation**
  + `moduloRange`, `moduloTwoPI`
  + `sexagesimalFormat`: extracts the separators used in the input string
  +  `sexagesimalToRadian`: converts a sexagesimal number to radians
  +  `radianToSexagesimal`: converts a number in radians to degrees, using a set of separators (optional)

* **Celestial Coordinates**
  + `eclipticToEquator(obliquity, longitude)`: converts ecliptic longitude to right ascension (given the obliquity of the ecliptic).
  + `equatorToEcliptic(obliquity, rightAscension)`: converts right ascension to ecliptic longitude (given the obliquity of the ecliptic).
  + `retrieveLatitude(obliquity, rightASC, rightIMC)` (radians), `retrieveLatitudeSexagesimal` (degrees): calculates the theoretical latitude of the observation site based on the obliquity of the ecliptic and the right ascensions of the Ascendant and *Imum Coeli* (IMC).
  + `retrieveLatitudeFromLong(obliquity, longASC, longIMC)` (radians), `retrieveLatitudeFromLongSexagesimal` (degrees): calculates the theoretical latitude based on the obliquity and the ecliptic longitudes of the Ascendant and *Imum Coeli* (IMC).
  + `retrieveLatitudeRange(obliquity, longASC, longIMC, error, direction)` (radians), `retrieveLatitudeRangeSexagesimal` (degrees): applies an error margin (`error`) to the latitude calculation, following the "cross" method proposed by North.
    * `direction = 0`: no error (identical to `retrieveLatitude`).
    * `direction = 1` (up) or `direction = 2` (down): error margin applied to the Ascendant's longitude.
    * `direction = 3` (left) or `direction = 4` (right): error margin applied to the *Imum Coeli*'s longitude.

> [!IMPORTANT]
> As of version 2, the `retrieveLatitudeRange` formula fixes inconsistencies found in the original PASCAL code. Consequently, it does not return the same results as the PASCAL program or version 1 of *Horosc for Google Sheets*. See [Differences with J.D. North's original program](#differences-with-jd-norths-original-program) for more details.

* **House Division (Domification)**: for each calculation method, functions `method0(obliquity, geoLatitude, rightASC, rightIMC, houseIndex, getRA)` through `method6` return either the right ascension (`getRA = true`) or the longitude (`getRA = false`) of a house cusp (`houseIndex` from 1 to 6). Inputs and results are in radians.
  + `method0`: _Hour Lines method_ (fixed boundaries). Cusps are the intersections of the ecliptic with the horizon, the meridian, and the unequal (even) hour lines. This method is traditionally graphical (using an astrolabe), emulated here via a convergence function.
  + `method1`: _Standard method_, known as Alcabitius. Uniform division of the equatorial cardinal sectors.
  + `method2`: _Dual longitude method_. Uniform division of the ecliptic cardinal sectors.
  + `method3`: _Prime Vertical method_ (fixed boundaries). Uniform division of the Prime Vertical.
  + `method4`: _Equatorial method_ (fixed boundaries). Uniform division of the equator on the local sphere.
  + `method5`: _Equatorial method_ (moving boundaries). Uniform division of the equator on the celestial sphere.
  + `method6`: _Single Longitude method_. Uniform division of the ecliptic.

* **Global functions**: these allow for chained conversions based on available inputs.
  + `computeCuspWithMethodInRadian(obliquity, geoLatitude, rightASC, longASC, rightIMC, longIMC, houseIndex, method, getRA)`: calls any `method` using right ascensions and longitudes (in radians).
  + `computeCuspFromLatitudeInRadian(obliquity, geoLatitude, longASC, houseIndex, method, getRA)`: calls any method using the Ascendant's longitude and the geographic latitude (in radians).
  + `computeCuspFromLatitudeInSexagesimal`: calls any method using the Ascendant's longitude and the geographic latitude (in degrees).
  + `computeCuspFromLongitudeInRadian(obliquity, longASC, longIMC, houseIndex, method, getRA)`: calls any method using the longitudes of the Ascendant and _Immum Coeli_ (in radians).
  + `computeCuspFromLongitudeInSexagesimal`: calls any method using the longitudes of the Ascendant and _Immum Coeli_ (in degrees).

* **Quality Coefficients**
  + `qualityCoefficientRadian(observedLongitude, computedLongitude)`, `qualityCoefficientDegree`: these represent the difference between an observed longitude (as transcribed from a historical source) and a calculated longitude.

### Differences with J. D. North's Original Program

Several algorithmic choices in the original Pascal program, particularly regarding latitude retrieval, appeared surprising and were not reproduced identically.

* The calculation of the theoretical latitude assumes that observations always take place in the Northern Hemisphere by applying an absolute value. **This behavior is preserved by default in this program.** Experimentally, an optional `methNorth` argument has been introduced in the `retrieveLatitude` function: if `methNorth = false`, the latitude is modulated between $-\pi/2$ and $\pi/2$ radians. This algorithm has not yet been fully tested; using it is currently not recommended (risk of incorrect or inconsistent results).

* The original composition of the "latitude cross" appeared inconsistent. The `FOI` and `FIO` functions in the Pascal code -- corresponding to our directions 1 and 2 in `retrieveLatitudeRange` (error margin applied to the Ascendant) -- also subtracted the error margin from the right ascension of the _Immum Coeli_, which is inconsistent with the calculation logic. **This correction has been applied by default since version 1.** It remains possible to manually calculate FOI as `retrieveLatitude(obliquity, rightASC - error, rightIMC - error)` and FIO as `retrieveLatitude(obliquity, rightASC + error, rightIMC - error)`.

* The margins of error used to calculate the "latitude cross" were associated in Pascal with a value in radians that did not actually correspond to their label. **The margins of error announced (in degrees) are used in this program** (since version 1) instead of the old values in radians, which may lead to latitude estimates that differ from those in the initial program).
  + \[D] "1 min. arc" was associated with 0.001745329 rad, in reality 0°06'00).
  + \[E] "half min." was associated with 0.00087266 rad, in reality 0°03'00).
  + \[F] "1 sec. arc" was associated with 0.000029089 rad, in reality 0°00'06"
