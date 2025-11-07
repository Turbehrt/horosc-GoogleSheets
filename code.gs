// This application is based on John D. North's HOROSC software
// after the MS-DOS Pascal code published in
// John D. North, Horoscopes and History (London: The Warburg Institute, 1986), Appendix 4

// Adaptation for Google Sheets by François J. Tur and Alexandre Tur, 2021.

// This software is governed by the CeCILL-B license under French law and
// abiding by the rules of distribution of free software.  You can  use, 
// modify and/ or redistribute the software under the terms of the CeCILL-B
// license as circulated by CEA, CNRS and INRIA at the following URL:
// http://www.cecill.info.


const TwoPI = Math.PI*2.0
const HalfPI = Math.PI/2.0
const ThirdPI = Math.PI/3.0
const SixthPI = Math.PI/6.0

const middleSkyCuspIndex = 4


function sexagesimalToRadian(sexa) {
  if (!sexa.split) throw Error(`invalid value sexa : ${sexa}  - ${typeof(sexa)}`)
  const parts = sexa.split(/[\s,.\'"]/)
  let r = 0
  let s = 1.0
  parts.forEach((p) => {
    if (p) {
    const v = parseInt(p, 10)
    r = r + (v * s)
    s = s  / 60 
    }
  })
  return (r / 360) * 2 * Math.PI
}

function radianToSexagesimal(radian) {
  const dg = radian * 360.0 / TwoPI
  const d = Math.floor(dg)
  const m = Math.floor((dg - d) * 60)
  const s = Math.floor((dg - d - m / 60) * 3600)
  return `${d}.${m < 10 ? '0':''}${m}\'${s < 10 ? '0':''}${s}`
}

function trySexaToRadianAndBack() {
  const v = sexagesimalToRadian('65.45\'02')
  const b = radianToSexagesimal(v)
}

function moduloTwoPI(value, rangeMin = 0) {
  const rangeMax = rangeMin + TwoPI
  let v = value
  while (v < rangeMin) { 
    v += TwoPI
  }
  i = 0
  while (v >= rangeMax) {
    v -= TwoPI
  }
  return v
}


function eclipticToEquator(epsilon, longitude) {
  let x = moduloTwoPI(Math.atan2(Math.cos(epsilon) * Math.sin(longitude), Math.cos(longitude)),0)
  // if (Math.abs( x - longitude) > Math.PI / 5.0) {
  //   x = x + Math.PI
  // }
  return moduloTwoPI(x, 0)
}

function equatorToEcliptic(epsilon, ascendant) {
  let x = moduloTwoPI(Math.atan2(Math.sin(ascendant) /  Math.cos(epsilon), Math.cos(ascendant)),0)
  // if (Math.abs( x - ascendant) > Math.PI / 5.0) {
  //   x = x + Math.PI
  // }
  return moduloTwoPI(x, 0)
}

function converge(maxError, cusp, midCusp, cuspNumber, epsilon, geoLatitude) {
  let error = maxError + 1
  let v = cusp
  while (error >= maxError) {
    const bracket = Math.acos(Math.sin(v)*Math.tan(epsilon)*Math.tan(geoLatitude)) / 3.0
    let bb = moduloTwoPI(midCusp - (4-cuspNumber)*bracket, 0)
    error = Math.abs(bb - v)
    v = bb
  }
  return v
}

function method0(baseElements) {
  // Hour Lines (fixed boundaries) method
  // Cusps are intersections of the ecliptic by the horizon, the meridian circle, and the unequal hour lines on the sphere for even-numbered hours.
  // This method is usually graphical, with aid of an astrolabe.

  const maxError = 0.000002 //sexaToRadian('00.00.005')
  const bracket = moduloTwoPI(baseElements.rightIMC - baseElements.rightAscendant) / 3.0
  const A2 = moduloTwoPI(baseElements.rightAscendant + bracket)
  const A3 = moduloTwoPI(A2, +bracket)
  const A5 = moduloTwoPI(baseElements.rightIMC + ThirdPI - bracket)
  const A6 = moduloTwoPI(A5 + ThirdPI - bracket)

  const rightAscendants = [baseElements.rightAscendant]
  rightAscendants.push(converge(maxError, A2, baseElements.rightIMC, 2, baseElements.epsilon, baseElements.geoLatitude))
  rightAscendants.push(converge(maxError, A3, baseElements.rightIMC, 3, baseElements.epsilon, baseElements.geoLatitude))
  rightAscendants.push(baseElements.rightIMC)
  rightAscendants.push(converge(maxError, A5, baseElements.rightIMC, 5, baseElements.epsilon, baseElements.geoLatitude))
  rightAscendants.push(converge(maxError, A6, baseElements.rightIMC, 6, baseElements.epsilon, baseElements.geoLatitude))
  const longitudes = rightAscendants.map((a) => equatorToEcliptic(baseElements.epsilon, a))
  return {rightAscendants, longitudes}
}

function method1(baseElements) {
  // Standard method
  // Uniform division of of the cardinal sectors of the Equator

  let bracket = moduloTwoPI(baseElements.rightIMC - baseElements.rightAscendant)
  const rightAscendants = [baseElements.rightAscendant]
  rightAscendants.push(moduloTwoPI(baseElements.rightAscendant + bracket / 3.0))
  rightAscendants.push(moduloTwoPI(baseElements.rightAscendant + 2 * bracket / 3.0))
  rightAscendants.push(baseElements.rightIMC)
  bracket = Math.PI - bracket
  rightAscendants.push(moduloTwoPI(baseElements.rightIMC + bracket / 3.0))
  rightAscendants.push(moduloTwoPI(baseElements.rightIMC + 2 * bracket / 3.0))
  //  const longitudes = rightAscendants.map((a) => mod2PI(withinRange(ascendantOnEquator(baseElements.epsilon, a), ThirdPI, Math.PI)))
  const longitudes = rightAscendants.map((a) => moduloTwoPI(equatorToEcliptic(baseElements.epsilon, a)))
  return {rightAscendants, longitudes}
}

function method2(baseElements) {
  // Dual longitude method
  // Uniform division of cardinal sectors of the Ecliptic

  let bracket = moduloTwoPI(baseElements.longIMC - baseElements.longAscendant)
  const longitudes = [baseElements.longAscendant]
  longitudes.push(moduloTwoPI(baseElements.longAscendant + bracket / 3.0))
  longitudes.push(moduloTwoPI(baseElements.longAscendant + 2 * bracket / 3.0))
  longitudes.push(baseElements.longIMC)
  bracket = Math.PI - bracket
  longitudes.push(moduloTwoPI(baseElements.longIMC + bracket / 3.0))
  longitudes.push(moduloTwoPI(baseElements.longIMC + 2 * bracket / 3.0))
  const rightAscendants = longitudes.map((l) => moduloTwoPI(eclipticToEquator(baseElements.epsilon, l)))
  return {rightAscendants, longitudes}
}

function method3(baseElements) {
  // Prime Vertical (fixed boundaries) method
  // Uniform division of the Prime Vertical

  const allAandL = [1,2,3,4,5,6].map((i) => {
    if (i ===4) return [baseElements.rightIMC, baseElements.longIMC]
    const theta = (i-1)*SixthPI
    let H = theta
    H = Math.atan2(Math.tan(theta), Math.cos(baseElements.geoLatitude))
    if (H < 0) {
        H += Math.PI
    }
    const A = moduloTwoPI(baseElements.rightIMC - HalfPI + H)
    let L = Math.atan2(Math.sin(A), Math.cos(A)*Math.cos(baseElements.epsilon) - Math.cos(H)*Math.tan(baseElements.geoLatitude)*Math.sin(baseElements.epsilon))
    // if (Math.abs(L - A) > ThirdPI) {L = L - Math.PI}
    L = moduloTwoPI(L)
    return [A, L]
  })
  const rightAscendants = allAandL.map(([A,L]) => A)
  const longitudes = allAandL.map(([A,L]) => L)
  return {rightAscendants, longitudes}
}

function method4(baseElements) {
  // Equatorial (fixed boundaries) method
  // Uniform division of the Equator (local sphere)
  
  const allAandL = [1,2,3,4,5,6].map((i) => {
    if (i ===4) return [baseElements.rightIMC, baseElements.longIMC]
    const H = (i-1)*Math.PI / 6.0
    const A = moduloTwoPI(baseElements.rightIMC - HalfPI + H)
    let L = Math.atan2(Math.sin(A), Math.cos(A)*Math.cos(baseElements.epsilon) - Math.cos(H)*Math.tan(baseElements.geoLatitude)*Math.sin(baseElements.epsilon))
    // if (Math.abs(L - A) > ThirdPI) {L = L - Math.PI}
    L = moduloTwoPI(L)
    return [A, L]
  })
  const rightAscendants = allAandL.map(([A,L]) => A)
  const longitudes = allAandL.map(([A,L]) => L)
  return {rightAscendants, longitudes}
}

function method5(baseElements) {
  // Equatorial (moving boundaries) method
  // Uniform division of the Equator (celestial sphere)

  const rightAscendants =  [1,2,3,4,5,6].map((i) => moduloTwoPI(baseElements.rightAscendant + (i-1)*SixthPI))
  const longitudes = rightAscendants.map((a) => equatorToEcliptic(baseElements.epsilon, a))
  return {rightAscendants, longitudes}
}

function method6(baseElements) {
  // Single longitudes method
  // Uniform division of the Ecliptic

  const longitudes =  [1,2,3,4,5,6].map((i) => moduloTwoPI(baseElements.longAscendant + (i-1)*SixthPI))
  const rightAscendants = longitudes.map((l) => eclipticToEquator(baseElements.epsilon, l))
  return {rightAscendants, longitudes}
}

const allMethods = [
  method0,
  method1,
  method2,
  method3,
  method4,
  method5,
  method6
]

function displayResults(radiansArray, destSexagArray, column) {
  radiansArray.forEach((v, i) => {
    destSexagArray[i][column] = radianToSexagesimal(v)
  })
}

function computeLongitudesAllMethodsLatitude(epsilonSx, longAscendantSx, geoLatitudeSx, nbLinesGap) {
  const epsilon = sexagesimalToRadian(epsilonSx)
  const geoLatitude = sexagesimalToRadian(geoLatitudeSx)
  const longAscendant= sexagesimalToRadian(longAscendantSx)
  const rightAscendant = eclipticToEquator(epsilon, longAscendant)
  const bracket= Math.asin(Math.sin(rightAscendant)*Math.tan(epsilon)*Math.tan(geoLatitude))
  const rightIMC = rightAscendant + HalfPI - bracket
  const longIMC= equatorToEcliptic(epsilon, rightIMC)
  
  const baseElements = {
    epsilon,
    geoLatitude,
    longAscendant,
    rightAscendant,
    rightIMC,
    longIMC
  }

  // each method take the baseElement as parameter and return the 2 arrays in radian
  const zoneAscendantsSx = [1,2,3,4,5,6].map((L) => Array(7).fill('-'))
  const zoneLongitudesSx = [1,2,3,4,5,6].map((L) => Array(7).fill('-'))
  allMethods.forEach((meth, i) => {
    const {rightAscendants, longitudes} = meth(baseElements)
    displayResults(rightAscendants, zoneAscendantsSx, i)
    displayResults(longitudes, zoneLongitudesSx, i)
  })

  return [...zoneLongitudesSx, ...Array(nbLinesGap).fill(''), ...zoneAscendantsSx]

}

function tryComputeLongitudesAllMethods() {
  computeLongitudesAllMethodsLatitude('23.00.00', '30.0.0','45.00.00',2)
}

function retrieveLatitude(epsilon, rightAscendant, rightIMC) {
  const bracket = rightIMC - rightAscendant
  let lat = moduloTwoPI(Math.abs(Math.atan2(Math.cos(bracket), Math.sin(rightAscendant)*Math.tan(epsilon))))
  if (lat > HalfPI && lat <Math.PI) { lat = Math.PI - lat}
  return lat
}

function qualities(longitutdesInit, longitudesFound) {
  const spread = longitutdesInit.map((l, i) => {
    let d = Math.abs(l - longitudesFound[i])
    if (d > Math.PI) d = Math.abs(TwoPI -d )
    return d  
  })
  const quality = (spread[1] + spread[2] + spread[4] + spread[5])/4.0
  return {spread, quality}
}

function displayQualities(quality, spreadArray, destSexagArray, column) {
  
  destSexagArray[0][column] = quality * (360.0 / TwoPI )
  spreadArray.forEach((v, i) => {
    destSexagArray[i+1][column] = v * (360.0 / TwoPI )
  })
  
}

function computeLongitudesAllMethodsLongitude(epsilonSx, errorLgSx, longitudesSx, nbLinesGap) {
  const longitudesInit = longitudesSx.map((lSx) => sexagesimalToRadian(`${lSx}`))
  const epsilon = sexagesimalToRadian(epsilonSx)
  const longAscendant= longitudesInit[0]
  const rightAscendant = eclipticToEquator(epsilon, longAscendant)
  const longIMC= longitudesInit[3]
  const rightIMC = eclipticToEquator(epsilon, longIMC)
  const geoLatitude = retrieveLatitude(epsilon, rightAscendant, rightIMC)
  
  const baseElements = {
    epsilon,
    geoLatitude,
    longAscendant,
    rightAscendant,
    rightIMC,
    longIMC
  }

  // each method take the baseElement as parameter and return the 2 arrays in radian
  const zoneAscendantsSx = [1,2,3,4,5,6].map((L) => Array(7).fill('-'))
  const zoneLongitudesSx = [1,2,3,4,5,6].map((L) => Array(7).fill('-'))
  const zoneQualityDeg = [0,1,2,3,4,5,6].map((L) => Array(7).fill('-'))
  allMethods.forEach((meth, i) => {
    const {rightAscendants, longitudes} = meth(baseElements)
    const {quality, spread} = qualities(longitudesInit, longitudes)
    displayResults(rightAscendants, zoneAscendantsSx, i)
    displayQualities(quality, spread, zoneQualityDeg, i)
    displayResults(longitudes, zoneLongitudesSx, i)
  })
  const errorLg = sexagesimalToRadian(errorLgSx)
  const displayLatitudeApproxDeg = [
    ['', radianToSexagesimal(retrieveLatitude(epsilon, rightAscendant, rightIMC+errorLg)), ''],
    [ radianToSexagesimal(retrieveLatitude(epsilon, rightAscendant-errorLg, rightIMC)), 
      radianToSexagesimal(geoLatitude), 
      radianToSexagesimal(retrieveLatitude(epsilon, rightAscendant+errorLg, rightIMC))],
    ['', radianToSexagesimal(retrieveLatitude(epsilon, rightAscendant, rightIMC-errorLg)), ''],
  ]

  return [...zoneLongitudesSx, 
        ...Array(nbLinesGap).fill(''), ...zoneQualityDeg, 
        ...Array(nbLinesGap).fill(''), ...zoneAscendantsSx,
        ...Array(nbLinesGap).fill(''), ...displayLatitudeApproxDeg
        ]

}

function tryComputeLongitudesAllMethodsLongitude() {
  computeLongitudesAllMethodsLongitude('23.00.00', ['5.0.0', '25.0.0', '50.0.0', '90.0.0', '115.0.0', '145.0.0'], 4)
}
