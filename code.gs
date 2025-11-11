// This application is based on John D. North's HOROSC software
// after the MS-DOS Pascal code published in
// John D. North, Horoscopes and History (London: The Warburg Institute, 1986), Appendix 4

// Adaptation for Google Sheets by François J. Tur and Alexandre Tur, 2021-.

// This software is governed by the CeCILL-B license under French law and
// abiding by the rules of distribution of free software.  You can  use,
// modify and/ or redistribute the software under the terms of the CeCILL-B
// license as circulated by CEA, CNRS and INRIA at the following URL:
// http://www.cecill.info.

// Auxiliary trigonometry

const TwoPI = Math.PI * 2.0;
const HalfPI = Math.PI / 2.0;
const ThirdPI = Math.PI / 3.0;
const SixthPI = Math.PI / 6.0;

/**
 * for a periodic function, ensures the value is within 0 - range, by cutting it by range size
 * @param {real} value to bound
 * @param {real} range width, by default the bound i [0, range].
 * @param {boolean} optional indication if the bound should be centered on zero [-range, +range]
 * @return {real} bounded value within range
 * @customfunction
 */
function moduloRange(value, range, zCentered = false) {
  let v = value;
  let s = 1;
  if (zCentered) {
    v = Math.abs(value);
    s = Math.sign(value);
  } else {
    while (v < 0) {
      v = v + range;
    }
  }
  while (v >= range) {
    v = v - range;
  }
  return s * v;
}

/**
 * computes the symetry of a value against a symetry point
 * @customfunction
 */
function moduloTwoPI(value, zCentered = false) {
  return moduloRange(value, TwoPI, zCentered);
}

// Degree/radian conversion and sexagesimal display

const SEXA_FORMAT = new RegExp("-?\\d+(\\D+)\\d+(\\D+)\\d+(\\D*)");
const SEXA_VALUE = new RegExp("(-?\\d+)\\D+(\\d+)\\D+(\\d+)");

/**
 * Extracts the sexagesimal format from a sexagesimal value
 * format is the set of separators between the different elements of the value
 *
 * @param {string} sexa the sexagesimal template
 * @return {Array of string} the format value to reuse later for formatting when converting radian to sexagesimal
 * @customfunction
 */
function sexagesimalFormat(sexa) {
  const regexpResult = SEXA_FORMAT.exec(sexa);
  return regexpResult.slice(1);
}

/**
 * converts a sexagesimal string (representing an angle in degrees) into an angle in radian
 * @param {string} sexa the sexagesimal value to convert
 * @return {real} the equivalent radian value
 * @customfunction
 */
function sexagesimalToRadian(sexa) {
  if (!sexa) throw Error(`invalid value sexa : ${sexa}  - ${typeof sexa}`);
  if (typeof sexa != "string")
    throw Error(`invalid type for  sexa : ${sexa}  - ${typeof sexa}`);
  const parts = SEXA_VALUE.exec(sexa).slice(1);
  let r = 0;
  let s = 1.0;
  parts.forEach((p) => {
    if (p) {
      const v = parseInt(p, 10);
      r = r + v * s;
      s = s / 60.0;
    }
  });
  return moduloTwoPI((r / 360.0) * TwoPI, true);
}

/**
 * converts an angle in radian into a sexagesimal representation in degrees, using a given set of symbols
 * @param {real} radian value to convert
 * @param {string or Array of strings} fmt - optional -  the format for presentation
 *  - if provided as string: 2 chars, first one for degrees separator, second for minutes separator
 *  - if provided as Array, then each element of the array are used as separator
 * @return {string} the sexagesimal representation of the radian value
 * @customfunction
 */
function radianToSexagesimal(radian, fmt = "°'\"") {
  const degSep = fmt[0] || "°";
  const mnSep = fmt[1] || "'";
  const secSep = fmt.length > 0 ? fmt[2] || "" : '"';
  const dg = (moduloTwoPI(radian, true) * 360.0) / TwoPI;
  let d = Math.floor(dg);
  let s = Math.round((dg - d) * 3600);
  let m = Math.floor(s / 60);
  s = s - m * 60;
  while (m >= 60) {
    d = d + 1;
    m = m - 60;
  }
  return `${d}${degSep}${m < 10 ? "0" : ""}${m}${mnSep}${
    s < 10 ? "0" : ""
  }${s}${secSep}`;
}

// Astronomical trigonometry

/**
 * converts a longitude in right ascension for a given obliquity of the ecliptic
 * @param {real} obliquity in radian
 * @param {real} longitude in radian
 * @return {real} the computed right ascension
 * @customfunction
 */
function eclipticToEquator(obliquity, longitude) {
  return moduloTwoPI(
    Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude))
  );
}

/**
 * converts a right ascension in longitude for a given obliquity of the ecliptic
 * @param {real} obliquity in radian
 * @param {real} right ascension in radian
 * @return {real} the computed longitude
 * @customfunction
 */
function equatorToEcliptic(obliquity, rightAscension) {
  return moduloTwoPI(
    Math.atan2(
      Math.sin(rightAscension) / Math.cos(obliquity),
      Math.cos(rightAscension)
    )
  );
}

/**
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the right ascension of the ascendant and the Imum Caeli (IMC, opposite the Medium Caeli).
 * @param {real} obliquity in radian
 * @param {real} right ascension of the ascendant in radian
 * @param {real} right ascension of the IMC in radian
 * @return {real} the geographical latitude in radian
 * @customfunction
 */
function retrieveLatitude(obliquity, rightASC, rightIMC) {
  const bracket = rightIMC - rightASC;
  let lat = Math.abs(
    Math.atan2(Math.cos(bracket), Math.sin(rightASC) * Math.tan(obliquity))
  );
  // initial code from NORTH - seems valid only if latitude > 0, meaning if observation is in notrh hemisphere
  lat = moduloTwoPI(lat);
  if (lat > HalfPI) {
    lat = Math.PI - lat;
  }

  // following lines return a value centered on [-Pi/2, +Pi/2] that is compatible with south hemishpere
  // if (lat > Math.PI / 2) lat -= Math.PI;
  // if (lat < -Math.PI / 2) lat += Math.PI;
  return lat;
}

/**
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the longitude of the ascendant and the Imum Caeli (IMC).
 * @param {real} obliquity in radian
 * @param {real} longitude of the ascendant in radian
 * @param {real} longitude of the IMC in radian
 * @return {real} the computed geographical latitude in radian
 * @customfunction
 */
function retrieveLatitudeFromLong(obliquity, longASC, longIMC) {
  const rightASC = eclipticToEquator(obliquity, longASC);
  const rightIMC = eclipticToEquator(obliquity, longIMC);

  return retrieveLatitude(obliquity, rightASC, rightIMC);
}

// Domification

function converge(
  cusp,
  midCusp,
  cuspNumber,
  obliquity,
  geoLatitude,
  maxError = 2e-6
) {
  let error = maxError + 1;
  let v = cusp;
  while (error >= maxError) {
    const bracket =
      Math.acos(Math.sin(v) * Math.tan(obliquity) * Math.tan(geoLatitude)) /
      3.0;
    const bb = moduloTwoPI(midCusp - (4 - cuspNumber) * bracket);
    error = Math.abs(bb - v);
    v = bb;
  }
  return v;
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6) following North's method 0:
 * * Hour Lines (fixed boundaries) method
 * * Cusps are intersections of the ecliptic by the horizon, the meridian circle, and the unequal hour lines on the sphere for even-numbered hours.
 * * This method is usually graphical, with aid of an astrolabe (here emulated with a convergence function).
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} geographical latitude of the observation location in radian
 * @param {real} right ascension of the Ascendant in radian
 * @param {real} right ascension of the IMC in radian
 * @param {integer} index of the house to compute (value 1 to 6)
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function method0(
  obliquity,
  geoLatitude,
  rightASC,
  rightIMC,
  houseIndex,
  getRA = true
) {
  let rightAscension = 0.0;
  const bracket = moduloTwoPI(rightIMC - rightASC) / 3.0;
  switch (houseIndex) {
    case 1:
      rightAscension = rightASC;
      break;
    case 2:
      rightAscension = converge(
        moduloTwoPI(rightASC + bracket),
        rightIMC,
        houseIndex,
        obliquity,
        geoLatitude
      );
      break;
    case 3:
      rightAscension = converge(
        moduloTwoPI(rightASC + 2 * bracket),
        rightIMC,
        houseIndex,
        obliquity,
        geoLatitude
      );
      break;
    case 4:
      rightAscension = rightIMC;
      break;
    case 5:
      rightAscension = converge(
        moduloTwoPI(rightIMC + ThirdPI - bracket),
        rightIMC,
        houseIndex,
        obliquity,
        geoLatitude
      );
      break;
    case 6:
      rightAscension = converge(
        moduloTwoPI(rightIMC + 2 * (ThirdPI - bracket)),
        rightIMC,
        houseIndex,
        obliquity,
        geoLatitude
      );
      break;
    default:
      throw Error(`invalid value houseIndex : ${houseIndex} for method0`);
  }
  const longitude = equatorToEcliptic(obliquity, rightAscension);
  return getRA ? rightAscension : longitude;
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6) following North's method 1:
 * * Standard method (Alcabitius)
 * * Uniform division of of the cardinal sectors of the Equator
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} right ascension of the Ascendant in radian
 * @param {real} right ascension of the IMC
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function method1(obliquity, rightASC, rightIMC, houseIndex, getRA = true) {
  let rightAscension = 0.0;
  const delta = moduloTwoPI(rightIMC - rightASC);
  const symDelta = Math.PI - delta;
  switch (houseIndex) {
    case 1:
      rightAscension = rightASC;
      break;
    case 2:
      rightAscension = moduloTwoPI(rightASC + delta / 3);
      break;
    case 3:
      rightAscension = moduloTwoPI(rightASC + (2 * delta) / 3);
      break;
    case 4:
      rightAscension = rightIMC;
      break;
    case 5:
      rightAscension = moduloTwoPI(rightIMC + symDelta / 3);
      break;
    case 6:
      rightAscension = moduloTwoPI(rightIMC + (2 * symDelta) / 3);
      break;
    default:
      throw Error(`invalid value houseIndex : ${houseIndex} for method1`);
  }
  const longitude = equatorToEcliptic(obliquity, rightAscension);
  return getRA ? rightAscension : longitude;
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6) following North's method 2:
 * * Dual longitude method
 * * Uniform division of of the cardinal sectors of the Equator
 *
 * @param {real} obliquity od the ecliptic in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {real} longitude of the IMC in radian
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function method2(obliquity, longASC, longIMC, houseIndex, getRA = true) {
  let longitude = 0.0;
  const delta = moduloTwoPI(longIMC - longASC);
  const symDelta = Math.PI - delta;
  switch (houseIndex) {
    case 1:
      longitude = longASC;
      break;
    case 2:
      longitude = moduloTwoPI(longASC + delta / 3);
      break;
    case 3:
      longitude = moduloTwoPI(longASC + (2 * delta) / 3);
      break;
    case 4:
      longitude = longIMC;
      break;
    case 5:
      longitude = moduloTwoPI(longIMC + symDelta / 3);
      break;
    case 6:
      longitude = moduloTwoPI(longIMC + (2 * symDelta) / 3);
      break;
    default:
      throw Error(`invalid value houseIndex : ${houseIndex} for method2`);
  }
  const rightAscension = eclipticToEquator(obliquity, longitude);
  return getRA ? rightAscension : longitude;
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6) following North's method 3:
 * * Prime Vertical (fixed boundaries) method
 * * Uniform division of the Prime Vertical
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} geographical latitude of the observation location in radian
 * @param {real} right ascendant of the IMC in radian
 * @param {real} longitude of the IMC in radian
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude).
 * @customfunction
 */
function method3(
  obliquity,
  geoLatitude,
  rightIMC,
  longIMC,
  houseIndex,
  getRA = true
) {
  let rightAscension = 0.0;
  let longitude = 0.0;

  switch (houseIndex) {
    case 4:
      rightAscension = rightIMC;
      longitude = longIMC;
      break;
    case 1:
    case 2:
    case 3:
    case 5:
    case 6:
      const theta = (houseIndex - 1) * SixthPI;
      let H = Math.atan2(Math.tan(theta), Math.cos(geoLatitude));
      if (H < 0) {
        H += Math.PI;
      }
      rightAscension = moduloTwoPI(rightIMC - HalfPI + H);
      longitude = moduloTwoPI(
        Math.atan2(
          Math.sin(rightAscension),
          Math.cos(rightAscension) * Math.cos(obliquity) -
            Math.cos(H) * Math.tan(geoLatitude) * Math.sin(obliquity)
        )
      );
      break;
    default:
      throw Error(`invalid value houseIndex : ${houseIndex} for method3`);
  }
  return getRA ? rightAscension : longitude;
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6) following North's method 4:
 * * Equatorial (fixed boundaries) method
 * * Uniform division of the Equator (local sphere)
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} geographical latitude of the observation location in radian
 * @param {real} right ascension of the IMC in radian
 * @param {real} longitude of the IMC in radian
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function method4(
  obliquity,
  geoLatitude,
  rightIMC,
  longIMC,
  houseIndex,
  getRA = true
) {
  let rightAscension = 0.0;
  let longitude = 0.0;

  switch (houseIndex) {
    case 4:
      rightAscension = rightIMC;
      longitude = longIMC;
      break;
    case 1:
    case 2:
    case 3:
    case 5:
    case 6:
      const H = (houseIndex - 1) * SixthPI;
      rightAscension = moduloTwoPI(rightIMC - HalfPI + H);
      longitude = moduloTwoPI(
        Math.atan2(
          Math.sin(rightAscension),
          Math.cos(rightAscension) * Math.cos(obliquity) -
            Math.cos(H) * Math.tan(geoLatitude) * Math.sin(obliquity)
        )
      );
      break;
    default:
      throw Error(`invalid value houseIndex : ${houseIndex} for method4`);
  }
  return getRA ? rightAscension : longitude;
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6) following North's method 5:
 * * Equatorial (moving boundaries) method
 * * Uniform division of the Equator (celestial sphere)
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} right asension of the Ascendant in radian
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function method5(obliquity, rightASC, houseIndex, getRA = true) {
  let rightAscension = 0.0;
  switch (houseIndex) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      rightAscension = moduloTwoPI(rightASC + (houseIndex - 1) * SixthPI);
      break;
    default:
      throw Error(`invalid value houseIndex : ${houseIndex} for method5`);
  }
  const longitude = equatorToEcliptic(obliquity, rightAscension);
  return getRA ? rightAscension : longitude;
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6) following North's method 6:
 * * Single longitudes method
 * * Uniform division of the Ecliptic
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function method6(obliquity, longASC, houseIndex, getRA = true) {
  let longitude = 0.0;
  switch (houseIndex) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      longitude = moduloTwoPI(longASC + (houseIndex - 1) * SixthPI);
      break;
    default:
      throw Error(`invalid value houseIndex : ${houseIndex} for method6`);
  }
  const rightAscension = eclipticToEquator(obliquity, longitude);
  return getRA ? rightAscension : longitude;
}

// Global functions for rapid results display

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6), base on any (0-6)
 * see each method0 to method6 function for details.
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} geographical latitude of the observation location in radian
 * @param {real} right ascension of the Ascendant in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {real} right ascension of the IMC in radian
 * @param {real} longitude of the IMC in radian
 * @param {integer} index of the house to compute (1-6)
 * @param {integer} index of the method to use (0-6)
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function computeCuspWithMethodInRadian(
  obliquity,
  geoLatitude,
  rightASC,
  longASC,
  rightIMC,
  longIMC,
  houseIndex,
  method,
  getRA = true
) {
  if (houseIndex < 1 || houseIndex > 6) {
    throw Error(
      `invalid value houseIndex : ${houseIndex} - must be a value between 1 and 6`
    );
  }
  switch (method) {
    case 0:
      return method0(
        obliquity,
        geoLatitude,
        rightASC,
        rightIMC,
        houseIndex,
        getRA
      );
    case 1:
      return method1(obliquity, rightASC, rightIMC, houseIndex, getRA);
    case 2:
      return method2(obliquity, longASC, longIMC, houseIndex, getRA);
    case 3:
      return method3(
        obliquity,
        geoLatitude,
        rightIMC,
        longIMC,
        houseIndex,
        getRA
      );
    case 4:
      return method4(
        obliquity,
        geoLatitude,
        rightIMC,
        longIMC,
        houseIndex,
        getRA
      );
    case 5:
      return method5(obliquity, rightASC, houseIndex, getRA);
    case 6:
      return method6(obliquity, longASC, houseIndex, getRA);
    default:
      throw Error(
        `invalid value method : ${method} - must be a value between 0 and 6`
      );
  }
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6), for any method (0-6), based on geographical latitude and ascendant longitude
 * (coordinates of the IMC are computed from the ascensional difference, cf. North's formula 5)
 *
 * @param {real} obliquity in radian
 * @param {real} geographical latitude of the obervation location in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {integer} index of the house to compute (1 though 6)
 * @param {integer} index of the method to use (0 though 6)
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
 * @customfunction
 */
function computeCuspFromLatitudeInRadian(
  obliquity,
  geoLatitude,
  longASC,
  houseIndex,
  method,
  getRA = true
) {
  const rightASC = eclipticToEquator(obliquity, longASC);
  const ascensionalDifference = Math.asin(
    Math.sin(rightASC) * Math.tan(obliquity) * Math.tan(geoLatitude)
  );
  const rightIMC = rightASC + HalfPI - ascensionalDifference;
  const longIMC = equatorToEcliptic(obliquity, rightIMC);

  return computeCuspWithMethodInRadian(
    obliquity,
    geoLatitude,
    rightASC,
    longASC,
    rightIMC,
    longIMC,
    houseIndex,
    method,
    getRA
  );
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6), for any method (0-6), based on geographical latitude and ascendant longitude, all expressed in sexagesimal degrees.
 *
 * @param {string} obliquity in sexagesimal
 * @param {string} geographical latitude of the observation location in sexagesimal
 * @param {string} longitude of the Ascendant in sexagesimal
 * @param {integer} index of the house to compute (1-6)
 * @param {integer} index of the method to use (0-6)
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {string} the computed coordinate in sexagesimal - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function computeCuspFromLatitudeInSexagesimal(
  obliquitySxg,
  geoLatitudeSxg,
  longASCSxg,
  houseIndex,
  method,
  getRA = true
) {
  const obliquity = sexagesimalToRadian(obliquitySxg);
  const longASC = sexagesimalToRadian(longASCSxg);
  const geoLatitude = sexagesimalToRadian(geoLatitudeSxg);

  return radianToSexagesimal(
    computeCuspFromLatitudeInRadian(
      obliquity,
      geoLatitude,
      longASC,
      houseIndex,
      method,
      getRA
    ),
    sexagesimalFormat(longASCSxg)
  );
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6), for any method (0-6) based on observed longitudes.
 * (geographical latitude is not given but deduced from the right ascensions of the Ascendant and IMC)
 *
 * @param {real} obliquity in radian
 * @param {real} observed longitude of the Ascendant in radian
 * @param {real} observed longitude of the IMC in radian
 * @param {integer} index of the house to compute (1-6)
 * @param {integer} index of the method to use (0-6)
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates (right ascension and longitude)
 * @customfunction
 */
function computeCuspFromLongitudeInRadian(
  obliquity,
  longASC,
  longIMC,
  houseIndex,
  method,
  getRA = true
) {
  const rightASC = eclipticToEquator(obliquity, longASC);
  const rightIMC = eclipticToEquator(obliquity, longIMC);
  const geoLatitude = retrieveLatitude(obliquity, rightASC, rightIMC);

  return computeCuspWithMethodInRadian(
    obliquity,
    geoLatitude,
    rightASC,
    longASC,
    rightIMC,
    longIMC,
    houseIndex,
    method,
    getRA
  );
}

/**
 * computes the coordinates (right ascension, longitude) of the cusp of any house (1-6), for any method (0-6), based on observed longitudes, all expressed in sexagesimal degrees.
 *
 * @param {string} obliquity in sexagesimal
 * @param {string} observed longitude of the Ascendant in sexagesimal
 * @param {string} observed longitude of the IMC in sexagesimal
 * @param {integer} index of the house to compute (1-6)
 * @param {integer} index of the method to use (0-6)
 * @param {boolean} which coordinate to return (true = right ascension, false = longitude) - default true
 * @return {string} the computed coordinate in sexagesimal - this function must be called twice to get both coordinates (right ascention and longitude)
 * @customfunction
 */
function computeCuspFromLongitudeInSexagesimal(
  obliquitySxg,
  longASCSxg,
  longIMCSxg,
  houseIndex,
  method,
  getRA = true
) {
  const obliquity = sexagesimalToRadian(obliquitySxg);
  const longASC = sexagesimalToRadian(longASCSxg);
  const longIMC = sexagesimalToRadian(longIMCSxg);

  return radianToSexagesimal(
    computeCuspFromLongitudeInRadian(
      obliquity,
      longASC,
      longIMC,
      houseIndex,
      method,
      getRA
    ),
    sexagesimalFormat(longASCSxg)
  );
}

// Quality coefficients

/**
 * computes quality coefficient between observed longitude and computed longitude
 *
 * @param {real} observed longitude in radian
 * @param {real} computed longitude in radian
 * @return {real} quality coefficient in radian
 * @customfunction
 */
function qualityCoefficientRadian(observedLongitude, computedLongitude) {
  return moduloRange(Math.abs(computedLongitude - observedLongitude), Math.PI);
}

/**
 * computes quality coefficient between observed longitude and computed longitude, expressed in sexagesimal degrees
 *
 * @param {string} observed longitude in sexagesimal degrees
 * @param {string} computed longitude in sexagesimal degrees
 * @return {real} quality coefficient in decimal degrees
 * @customfunction
 */
function qualityCoefficientDegree(observedLongitudeSx, computedLongitudeSx) {
  const observedLongitude = sexagesimalToRadian(observedLongitudeSx);
  const computedLongitude = sexagesimalToRadian(computedLongitudeSx);
  return (
    qualityCoefficientRadian(observedLongitude, computedLongitude) *
    (360.0 / TwoPI)
  );
}

// Geographical latitude

/**
 * calculates the theoretical latitude of the observation location from the right ascensions of the ascendant and the Imum Caeli (IMC) and the obliquity of the ecliptic, all expressed in sexagesimal degrees.
 *
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {string} right ascension of the Ascendant in sexagesimal
 * @param {string} right ascension of the IMC in sexagesimal
 * @return {string} the computed geographical latitude of observation location in sexagesimal
 * @customfunction
 */
function retrieveLatitudeSexagesimal(obliquitySxg, rightASCSxg, rightIMCSxg) {
  const obliquity = sexagesimalToRadian(obliquitySxg);
  const rightASC = sexagesimalToRadian(rightASCSxg);
  const rightIMC = sexagesimalToRadian(rightIMCSxg);

  retrieveLatitudeSexagesimal = radianToSexagesimal(
    retrieveLatitude(obliquity, rightASC, rightIMC),
    sexagesimalFormat(rightASCSxg)
  );
}

/**
 * calculates the theoretical latitude of the observation location from the longitudes of the ascendant and the Imum Caeli (IMC) and the obliquity of the ecliptic, all expressed in sexagesimal degrees.
 *
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {string} longitude of the Ascendant in sexagesimal
 * @param {string} longitude of the IMC in sexagesimal
 * @return {string} the computed geographical latitude of observation location in sexagesimal
 * @customfunction
 */
function retrieveLatitudeFromLongSexagesimal(
  obliquitySxg,
  longASCSxg,
  longIMCSxg
) {
  const obliquity = sexagesimalToRadian(obliquitySxg);
  const longASC = sexagesimalToRadian(longASCSxg);
  const longIMC = sexagesimalToRadian(longIMCSxg);

  return radianToSexagesimal(
    retrieveLatitudeFromLong(obliquity, longASC, longIMC),
    sexagesimalFormat(longASCSxg)
  );
}

/**
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the longitudes of the ascendant and the Imum Caeli (IMC) in radian, when deviated of an error of observation (or rounding approximation) in a direction
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {real} longitude of the IMC in radian
 * @param {real} error of observation in radian
 * @param {integer} direction of the error - a valude from 0 to 4.
 *   - 0 indicates no deviation
 *   - 1 and 2 indicate deviation by error value respectively in lower or excess from the longitude of the ascendant
 *   - 4 and 3 indicate deviation by error value respectively in lower or excess from the longitude of the IMC/MC
 * @return {real} the computed geographical latitude in radian
 * @customfunction
 */
function retrieveLatitudeRange(obliquity, longASC, longIMC, error, direction) {
  const rightASC = eclipticToEquator(obliquity, longASC);
  const rightIMC = eclipticToEquator(obliquity, longIMC);

  switch (direction) {
    // Case 0 : exact value
    case 0:
      return retrieveLatitude(obliquity, rightASC, rightIMC);

    // Case 1 (lower) and 2 (upper) : assumption that the astrologer started from the ascendent (+/- max error)
    case 1:
      // 1 rightASC - error
      // NOTE: it is a change from North's programme
      // Initial programme: FOI = RetrieveLatitudeRange = retrieveLatitude(obliquity, rightASC - error, rightIMC - error)
      return retrieveLatitude(obliquity, rightASC - error, rightIMC);
    case 2:
      // 2 rightASC + error
      // NOTE: it is a change from North's programme
      // Initial programme: FIO = RetrieveLatitudeRange = retrieveLatitude(obliquity, rightASC + error, rightIMC - error)
      return retrieveLatitude(obliquity, rightASC + error, rightIMC);

    // Case 3 (left) and 4 (right) : assumption that the astrologer started from the MC (+/- max error)
    case 3:
      // 3 rightIMC + error
      return retrieveLatitude(obliquity, rightASC, rightIMC + error);
    case 4:
      // 4 rightIMC - error
      return retrieveLatitude(obliquity, rightASC, rightIMC - error);

    default:
      throw Error(
        `invalid value direction : ${direction} - must be a value between 0 and 4`
      );
  }
}

/**
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the longitudes of the ascendant and the Imum Caeli (IMC) in sexagesimal degrees, when deviated of an error of observation (or rounding approximation) in a direction
 *
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {string} longitude of the Ascendant in sexagesimal
 * @param {string} longitude of the IMC in sexagesimal
 * @param {string} error of observation in sexagesimal
 * @param {integer} direction of the error - a valude from 0 to 4.
 *   - 0 indicated no deviation
 *   - 1 and 2 indicate deviation by error value respectively in lower or excess from longitude of ascendant
 *   - 4 and 3 indicate deviation by error value respectively in lower or excess from longitude of IMC
 * @return {string} the computed geographical latitude in sexagesimal
 * @customfunction
 */
function retrieveLatitudeRangeSexagesimal(
  obliquitySxg,
  longASCSxg,
  longIMCSxg,
  errorSxg,
  direction
) {
  const fmt = sexagesimalFormat(longASCSxg);
  return radianToSexagesimal(
    retrieveLatitudeRange(
      sexagesimalToRadian(obliquitySxg),
      sexagesimalToRadian(longASCSxg),
      sexagesimalToRadian(longIMCSxg),
      sexagesimalToRadian(errorSxg),
      direction
    ),
    fmt
  );
}

// Global functions (North's methods A and B)

/**
 * Method A : computes the theoretical calculation of the sexagesimal longitudes and/or right ascensions of the first 6 houses (the next 6 are inferred by symmetry) according to the 7 historical house systems
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {string} geographical latitude of observation location in sexagesimal
 * @param {string} longitude of the Ascendant in sexagesimal
 * @param {integer} number of rows to separate the 2 result tables
 * @return {string} an array of lines and columns that provides all longitudes and right ascensions computed
 * @customfunction
 */
function computeLongitudesAllMethodsLatitude(
  obliquitySx,
  geoLatitudeSx,
  longASCSx,
  nbLinesGap
) {
  const methods = [0, 1, 2, 3, 4, 5, 6];
  const houses = [1, 2, 3, 4, 5, 6];

  const zoneAscendantsSx = houses.map((L) => Array(methods.length).fill("-"));
  const zoneLongitudesSx = houses.map((L) => Array(methods.length).fill("-"));
  houses.forEach((house, hInd) => {
    methods.forEach((method, mInd) => {
      zoneAscendantsSx[hInd][mInd] = computeCuspFromLatitudeInSexagesimal(
        obliquitySx,
        geoLatitudeSx,
        longASCSx,
        house,
        method
      );
      zoneLongitudesSx[hInd][mInd] = computeCuspFromLatitudeInSexagesimal(
        obliquitySx,
        geoLatitudeSx,
        longASCSx,
        house,
        method,
        false
      );
    });
  });

  return [
    ...zoneLongitudesSx,
    ...Array(nbLinesGap).fill(""),
    ...zoneAscendantsSx,
  ];
}

/**
 * Method B: Theoretical calculation of the latitude of the observation site (with an interval corresponding to the margin of error, applied to the right ascension of the ascendant or the midheaven) and a comparison with the theoretical longitudes (calculated considering only the ascendant and the midheaven) according to the seven historical house systems, with a quality coefficient (generally allowing the method actually used to be identified)
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {range of strings} observed longitudes for all 6 houses in sexagesimal
 * @param {string} error for geographical latitude deviation in sexagesimal
 * @param {integer} number of rows to separate each result table
 * @return {string} an array of lines and columns that provides all theoretical longitudes, quality coefficients, theoretical right ascensions, and the cross of geographical latitude deviation
 * @customfunction
 */
function computeLongitudesAllMethodsLongitude(
  obliquitySx,
  longitudesSx,
  errorLgSx,
  nbLinesGap
) {
  const methods = [0, 1, 2, 3, 4, 5, 6];
  const houses = [1, 2, 3, 4, 5, 6];
  const qualities = [1, 2, 3, 4, 5, 6];

  const zoneAscendantsSx = houses.map((L) => Array(methods.length).fill("-"));
  const zoneLongitudesSx = houses.map((L) => Array(methods.length).fill("-"));
  const zoneQualityDeg = qualities.map((L) => Array(methods.length).fill("-"));
  const zoneAvgQualityDeg = [Array(methods.length).fill("-")];

  const longASCSx = longitudesSx[0].toString(); // by definition the ASC is the observed longiude of house 1
  const longIMCSx = longitudesSx[3].toString(); // by definition the IMC is the observed longiude of house 4

  houses.forEach((house, hInd) => {
    methods.forEach((method, mInd) => {
      zoneAscendantsSx[hInd][mInd] = computeCuspFromLongitudeInSexagesimal(
        obliquitySx,
        longASCSx,
        longIMCSx,
        house,
        method,
        true
      );
      const longSx = computeCuspFromLongitudeInSexagesimal(
        obliquitySx,
        longASCSx,
        longIMCSx,
        house,
        method,
        false
      );
      zoneLongitudesSx[hInd][mInd] = longSx;
      zoneQualityDeg[hInd][mInd] = qualityCoefficientDegree(
        longitudesSx[hInd].toString(),
        longSx
      );
    });
  });

  // computes quality average
  methods.forEach((method, mInd) => {
    zoneAvgQualityDeg[0][mInd] =
      (zoneQualityDeg[1][mInd] +
        zoneQualityDeg[2][mInd] +
        zoneQualityDeg[4][mInd] +
        zoneQualityDeg[5][mInd]) /
      4;
  });

  const displayLatitudeApproxDeg = [
    [
      "",
      retrieveLatitudeRangeSexagesimal(
        obliquitySx,
        longASCSx,
        longIMCSx,
        errorLgSx,
        3
      ),
      "",
    ],
    [
      retrieveLatitudeRangeSexagesimal(
        obliquitySx,
        longASCSx,
        longIMCSx,
        errorLgSx,
        1
      ),
      retrieveLatitudeRangeSexagesimal(
        obliquitySx,
        longASCSx,
        longIMCSx,
        errorLgSx,
        0
      ),
      retrieveLatitudeRangeSexagesimal(
        obliquitySx,
        longASCSx,
        longIMCSx,
        errorLgSx,
        2
      ),
    ],
    [
      "",
      retrieveLatitudeRangeSexagesimal(
        obliquitySx,
        longASCSx,
        longIMCSx,
        errorLgSx,
        4
      ),
      "",
    ],
  ];

  return [
    ...zoneLongitudesSx,
    ...Array(nbLinesGap).fill(""),
    ...zoneAvgQualityDeg,
    ...zoneQualityDeg,
    ...Array(nbLinesGap).fill(""),
    ...zoneAscendantsSx,
    ...Array(nbLinesGap).fill(""),
    ...displayLatitudeApproxDeg,
  ];
}
