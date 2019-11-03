var geohash = require('ngeohash');

var tsProfiles;
var tsGroups;
var tsQuestions;

function parseCoordinates(coords){
    var geohashCoord = {}
    coords.forEach((coord) => {
        let encode = geohash.encode(coord['pos']['x'], coord['pos']['y'], 5);
        if (geohashCoord[encode] === undefined){
            geohashCoord[encode] = 0;
        }
        geohashCoord[encode]++;
    })
    return geohashToCoord(geohashCoord)
}

function geohashToCoord(geohashCoord){
    let coords = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": []
    }
    var max = 0, min = 9999999999, a = 0, b = 6;
    for (let [key, value] of Object.entries(geohashCoord)) {
        max = Math.max(value, max)
        min = Math.min(value, min)
    }
    min--; // avvolte min e max sono uguali quindi min-max fa 0 e value - min / 0 da NaN
    
    for (let [key, value] of Object.entries(geohashCoord)) {
        var latlon = geohash.decode(key);
        var nomalizeValue = (b - a) * ((value - min) / (max - min)) + a
        let tmp = {
            "type": "Feature",
            "properties": {
                "mag": nomalizeValue,
            },
            "geometry": { "type": "Point", "coordinates": [latlon.latitude, latlon.longitude] }
        }
        coords.features.push(tmp)
    }
    return coords
}

exports.createTsProfiles = (coordsProfiles) => {
    tsProfiles = parseCoordinates(coordsProfiles)
}
exports.getTsProfiles = () => {
    return tsProfiles
}

exports.createTsGroups = (coordsGroups) => {
    tsGroups = parseCoordinates(coordsGroups)
}
exports.getTsGroups = () => {
    return tsGroups
}

exports.createTsQuestions = (coordsQuestions) => {
    tsQuestions = parseCoordinates(coordsQuestions)
}
exports.getTsQuestions = () => {
    return tsQuestions
}