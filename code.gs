// This application is based on John D. North's HOROSC software
// after the MS-DOS Pascal code published in
// John D. North, Horoscopes and History (London: The Warburg Institute, 1986), Appendix 4

// Adaptation for Google Sheets by François J. Tur and Alexandre Tur, 2021.

// This software is governed by the CeCILL-B license under French law and
// abiding by the rules of distribution of free software.  You can  use, 
// modify and/ or redistribute the software under the terms of the CeCILL-B
// license as circulated by CEA, CNRS and INRIA at the following URL:
// http://www.cecill.info.


const TwoPI = Math.PI * 2.0;
const HalfPI = Math.PI / 2.0;
const ThirdPI = Math.PI / 3.0;
const SixthPI = Math.PI / 6.0;

/**
 * for periodic function, ensure the value is within 0 - range, by cutting it by range size
 * @param {real} value to bound
 * @param {real} range upper bound of the range. 0 is the lower bound
 * @return {real} bounded value within range
 * @customfunction
 */
function moduloRange(value, range) {
  let v = value;
  while (v < 0) {
    v = v + range;
  }
  while (v >= range) {
    v = v - range;
  }
  return v;
}

/**
 * compute the symetry of a value against a symetry point
 * @customfunction
 */
function symetryTo(value, symetryPoint) {
  if (value > symetryPoint) {
    return Math.abs(2 * symetryPoint - value);
  }
  return value;
}
function moduloTwoPI(value) {
  return moduloRange(value, TwoPI);
}

/**
 * extract the format from a sexagesimal value
 * ie the chars that separate degrees from minutes
 * and the chars that separate minutes from seconds
 *
 * @param {string} a sexagesimal value
 * @return the two values for separator as an Array
 */

const SEXA_FORMAT = new RegExp("\\d+(\\D+)\\d+(\\D+)");
const SEXA_VALUE = new RegExp("(\\d+)\\D+(\\d+)\\D+(\\d+)");

/**
 * Extract the sexagesimal format from a sexagesimal value
 * format is the set of separators betweem the different elements of the value
 *
 * @param {string} the sexagesimal template
 * @return {Array of string} the format value to reuse later for formatting when translation radian to sexagesimal
 * @customfunction
 */
function sexagesimalFormat(sexa) {
  const regexpResult = SEXA_FORMAT.exec(sexa);
  return regexpResult.slice(1);
}

/**
 * @param {string} sexa the sexagesimal value to transform
 * @return {real} the corresponding radian value
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
  return moduloTwoPI((r / 360.0) * 2 * Math.PI);
}

/**
 * @param {real} radian value to convert
 * @param {string or Array of string} fmt - optional -  the format for presentation
 *  - if provided as string the 2 chars first one for degrees sep, second for minutes sep
 *  - if provided as Array, then each element of the array are used as separator
 * @return {string} the sexagesimal representation of the radian value
 * @customfunction
 */
function radianToSexagesimal(radian, fmt = ".'") {
  const degSep = fmt[0] || ".";
  const mnSep = fmt[1] || "'";
  const dg = (moduloTwoPI(radian) * 360.0) / TwoPI;
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
  }${s}`;
}

/**
 * convert a longitude in right ascension for a given obliquity of the ecliptic
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
 * convert a right ascention in longitude for a given obliquity of the ecliptic
 * @param {real} obliquity in radian
 * @param {real} right ascention in radian
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
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the right ascension of the ascendant and the Imum Caeli (IMC).
 * @param {real} obliquity in radian
 * @param {real} right ascension of the ascendant in radian
 * @param {real} right ascension of the IMC in radian
 * @return {real} the geographical latitude in radian
 * @customfunction
 */
function retrieveLatitude(obliquity, rightASC, rightIMC) {
  const bracket = rightIMC - rightASC;
  return (lat = symetryTo(
    moduloRange(
      Math.abs(
        Math.atan2(Math.cos(bracket), Math.sin(rightASC) * Math.tan(obliquity))
      ),
      Math.PI
    ),
    HalfPI
  ));
}

/**
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the longitude of the ascendant and the Imum Caeli (IMC).
 *
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
 * compute the coordinates (right Ascencion, longitude) of the cusp of one house following the method:
 * * Hour Lines (fixed boundaries) method
 * * Cusps are intersections of the ecliptic by the horizon, the meridian circle, and the unequal hour lines on the sphere for even-numbered hours.
 * * This method is usually graphical, with aid of an astrolabe.
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} geographical latitude of the observation location in radian
 * @param {real} right ascention of the Ascendant in radian
 * @param {real} right ascention of the IMC
 * @param {integer} index of the house to compute (value 1 to 6)
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house following the method:
 * * Standard method
 * * Uniform division of of the cardinal sectors of the Equator
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} right ascension of the Ascendant in radian
 * @param {real} right ascentsion of the IMC
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house  following the method:
 * * Dual longitude method
 * * Uniform division of of the cardinal sectors of the Equator
 *
 * @param {real} obliquity od the ecliptic in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {real} longitude of the IMC
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house following the method:
 * * Prime Vertical (fixed boundaries) method
 * * Uniform division of the Prime Vertical
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} geographical latitude of the observation location in radian
 * @param {real} right ascendant of the IMC in radian
 * @param {real} longitude of the IMC in radian
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
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
  // Prime Vertical (fixed boundaries) method
  // Uniform division of the Prime Vertical

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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house following the method:
 * * Equatorial (fixed boundaries) method
 * * Uniform division of the Equator (local sphere)
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} geographical latitude of the observation location in radian
 * @param {real} right ascension of the IMC in radian
 * @param {real} longitude of the IMC in radian
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house  following the method:
 * * Equatorial (moving boundaries) method
 * * Uniform division of the Equator (celestial sphere)
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} right asension of the Ascendant in radian
 * @param {integer} index of the house to compute
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
 * @customfunction
 */
function method5(obliquity, rightASC, houseIndex, getRA = true) {
  // Equatorial (moving boundaries) method
  // Uniform division of the Equator (celestial sphere)

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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house  following the method:
 * * Single longitudes method
 * * Uniform division of the Ecliptic
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
 * @customfunction
 */
function method6(obliquity, longASC, houseIndex, getRA = true) {
  // Single longitudes method
  // Uniform division of the Ecliptic

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

/**
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house, base on method index provided
 * see each method0 to method6 function for details.
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} geographical latitude of the observation location in radian
 * @param {real} right ascention of the Ascendant in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {real} right ascention of the IMC in radian
 * @param {real} longitude of the IMC in radian
 * @param {integer} index of the house to compute (1 though 6)
 * @param {integer} index of the method to use (0 though 6)
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house, for a specific method based on geographical latitude and longitude ascendant.
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
  // Compute a cusp given a known obliquity, geographical latitude, ascendant, and method

  // Pre-computes IMC (rightIMC = rightVernalPoint + pi/2)
  // Formula (5) : sin(ascensionalDifference) = tan(obliquity) * tan(geoLat) * sin(rightASC)
  // where the ascensionalDifference = rightASC - rightVernalPoint

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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house, for a specific method based on geographical latitude and longitude ascendant.
 *
 * @param {string} obliquity in sexagesimal
 * @param {string} geographical latitude of the observation location in sexagesimal
 * @param {string} longitude of the Ascendant in sexagesimal
 * @param {integer} index of the house to compute (1 though 6)
 * @param {integer} index of the method to use (0 though 6)
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {string} the computed coordinate in sexagesimal - this function must be called twice to get both coordinates
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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house, for a specific method based on observed longitudes.
 *
 * @param {real} obliquity in radian
 * @param {real} observed longitude of the Ascendant in radian
 * @param {real} observed longitude of the IMC in radian
 * @param {integer} index of the house to compute (1 though 6)
 * @param {integer} index of the method to use (0 though 6)
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {real} the computed coordinate in radian - this function must be called twice to get both coordinates
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
  // Compute a cusp given a known obliquity, ascendant, MC, and method (geographical latitude unknown)

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
 * compute the coordinates (right Ascencion, longitude) of the cusp of an house, for a specific method based on observed longitudes.
 *
 * @param {string} obliquity in sexagesimal
 * @param {string} observed longitude of the Ascendant in sexagesimal
 * @param {string} observed longitude of the IMC in sexagesimal
 * @param {integer} index of the house to compute (1 though 6)
 * @param {integer} index of the method to use (0 though 6)
 * @param {boolean} which coordinate to return (true = right ascention, false = longitude) - default true
 * @return {string} the computed coordinate in sexagesimal - this function must be called twice to get both coordinates
 * @customfunction
 */ function computeCuspFromLongitudeInSexagesimal(
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

/**
 * compute quality coefficient between observe longitude and computed longitude
 *
 * @param {real} observed longitude in radian
 * @param {real} computed longitude in radian
 * @return {real} quality coefficient in radian
 * @customfunction
 */
function qualityCoefficientRadian(observedLongitude, computedLongitude) {
  // Difference between the cusp provided and the expected value
  return moduloRange(Math.abs(computedLongitude - observedLongitude), Math.PI);
}

/**
 * compute quality coefficient between observe longitude and computed longitude
 *
 * @param {string} observed longitude in sexagesimal
 * @param {string} computed longitude in sexagesimal
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

/**
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the right ascensions of the ascendant and the Imum Caeli (IMC).
 *
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {string} right ascension of the Ascendant in sexagesimal
 * @param {string} right ascension of the IMC in sexagesimal
 * @return {string} the computed geographical latitude of observationb location in sexagesimal
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
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the longitude of the ascendant and the Imum Caeli (IMC).
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
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the longitude of the ascendant and the Imum Caeli (IMC), when deviated of an error of observation in a direction
 *
 * @param {real} obliquity of the ecliptic in radian
 * @param {real} longitude of the Ascendant in radian
 * @param {real} longitude of the IMC in radian
 * @param {real} error of observation in radian
 * @param {integer} direction of the error - a valude from 0 to 4.
 *   - 0 indicated no deviation
 *   - 1 and 2 indicate deviation by error value resp in lower or excess from longitude of ascendant
 *   - 4 and 3 indicate deviation by error value resp in lower or excess from longitude of IMC
 * @return {real} the computed geographical latitude in radian
 * @customfunction
 */
function retrieveLatitudeRange(obliquity, longASC, longIMC, error, direction) {
  const rightASC = eclipticToEquator(obliquity, longASC);
  const rightIMC = eclipticToEquator(obliquity, longIMC);

  switch (direction) {
    case 0:
      // 0 Exact value
      return retrieveLatitude(obliquity, rightASC, rightIMC);

    // Case 1 (uppper) and 2 (lower) : assumption that the astrologer started from the ascendent (+/- max error)
    case 1:
      // 1 rightASC - error
      // NOTE: it is a change from initial program
      // Initial program: FOI = RetrieveLatitudeRange = retrieveLatitude(obliquity, rightASC - error, rightIMC - error)
      return retrieveLatitude(obliquity, rightASC - error, rightIMC);
    case 2:
      // 2 rightASC + error
      // NOTE: it is a change from initial program
      // Initial program: FIO = RetrieveLatitudeRange = retrieveLatitude(obliquity, rightASC + error, rightIMC - error)
      return retrieveLatitude(obliquity, rightASC + error, rightIMC);

    //Case 3 (left) and 4 (right) : assumption that the astrologer started from the MC (+/- max error)
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
 * calculates the theoretical latitude of the observation location from the obliquity of the ecliptic and the longitude of the ascendant and the Imum Caeli (IMC), when deviated of an error of observation in a direction
 *
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {string} longitude of the Ascendant in sexagesimal
 * @param {string} longitude of the IMC in sexagesimal
 * @param {string} error of observation in sexagesimal
 * @param {integer} direction of the error - a valude from 0 to 4.
 *   - 0 indicated no deviation
 *   - 1 and 2 indicate deviation by error value resp in lower or excess from longitude of ascendant
 *   - 4 and 3 indicate deviation by error value resp in lower or excess from longitude of IMC
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

/**
 * compute the theoretical calculation of the sexagesimal longitudes and/or right ascensions of the first 6 houses (the next 6 are inferred by symmetry) according to the 7 historical house systems
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {string} geographical latitude of observation location in sexagesimal
 * @param {string} longitude of the Ascendant in sexagesimal
 * @param {integer} number of rows to separate the 2 result tables
 * @return {string} an arrays of lines and columns that provides all longitudes and right assencions computed
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

  // each method take the baseElement as parameter and return the 2 arrays in radian
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
 * Theoretical calculation of the latitude of the observation site (with an interval corresponding to the margin of error, applied to the right ascension of the ascendant or the midheaven) and a comparison with the theoretical longitudes (calculated considering only the ascendant and the midheaven) according to the seven historical house systems, with a quality coefficient (generally allowing the method actually used to be identified)
 * @param {string} obliquity of the ecliptic in sexagesimal
 * @param {range of string} observed longitudes for all 6 houses in sexagesimal
 * @param {string} error for geographical latitude deviation in sexagesimal
 * @param {integer} number of rows to separate each results
 * @return {string} an arrays of lines and columns that provides all longitudes, all qualities of computed longitudes vs observed ones, all right ascencions computed, and the cross of geographical latitude deviation
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

  // each method take the baseElement as parameter and return the 2 arrays in radian
  const zoneAscendantsSx = houses.map((L) => Array(methods.length).fill("-"));
  const zoneLongitudesSx = houses.map((L) => Array(methods.length).fill("-"));
  const zoneQualityDeg = qualities.map((L) => Array(methods.length).fill("-"));
  const zoneAvgQualityDeg = [Array(methods.length).fill("-")];

  const longASCSx = longitudesSx[0].toString(); // by definition the ASC is the observed longiude of house 1
  const longIMCSx = longitudesSx[3].toString(); // by definition the ASC is the observed longiude of house 4

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

  // compute quality average
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
