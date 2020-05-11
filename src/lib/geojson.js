/**
 * Utility module to work with geoJson objects containing only one feature
 */


function getGeometryCoordinates(geoJson) {
  if (
    geoJson && Array.isArray(geoJson.features) && geoJson.features[0]
    && geoJson.features[0].geometry
  ) {
    return geoJson.features[0].geometry.coordinates;
  }
  return null;
}

function getProperties(geoJson) {
  if (
    geoJson && Array.isArray(geoJson.features) && geoJson.features[0]
    && geoJson.features[0].properties
  ) {
    return geoJson.features[0].properties;
  }
  return null;
}

function updateGeoJson(geoJson, coordinates, ascent, descent, distance) {
  const updatedGeoJson = { ...geoJson };
  updatedGeoJson.features[0].geometry.coordinates = coordinates;
  updatedGeoJson.features[0].properties.ascent = ascent;
  updatedGeoJson.features[0].properties.descent = descent;
  updatedGeoJson.features[0].properties.summary.distance = distance;

  return updatedGeoJson;
}

export default function mergeGeoJsons(geoJson1, geoJson2) {
  const geometry1 = getGeometryCoordinates(geoJson1);
  const geometry2 = getGeometryCoordinates(geoJson2);
  // const mergedGeoJson = replaceGeometryCoordinates(
  //   geoJson1, [...geometry1.slice(0, -1), ...geometry2],
  // );
  const mergedGeometry = [...geometry1.slice(0, -1), ...geometry2];

  const properties1 = getProperties(geoJson1);
  const properties2 = getProperties(geoJson2);
  const mergedAscent = properties1.ascent + properties2.ascent;
  const mergedDescent = properties1.descent + properties2.descent;
  const mergedDistance = properties1.summary.distance + properties2.summary.distance;


  const mergedGeoJson = updateGeoJson(geoJson1, mergedGeometry, mergedAscent, mergedDescent, mergedDistance);

  return mergedGeoJson;
}
