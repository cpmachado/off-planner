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

function emptyGeoJson() {
  return {
    type: 'FeatureCollection',
    features: [
      {
        bbox: [
          // -0.993317, 42.421439, 34.7, 1.481704, 44.119525, 2080.59,
        ],

        type: 'Feature',
        properties: {
          ascent: 0,
          descent: 0,
          segments: [
          ],
          extras: {
            steepness: {
              values: [
                // [0, 1, 7],
              ],
              summary: [
                {
                  value: 0,
                  distance: 0,
                  amount: 0,
                },
              ],
            },
          },
          summary: {
            distance: 0,
            duration: 0,
          },
          way_points: [
          ],
        },
        geometry: {
          coordinates: [
            // [-0.331652, 42.957277, 1363.5],
            // [-0.331005, 42.957646, 1364],
          ],
          type: 'LineString',
        },
      },
    ],
    bbox: [
    ],
    metadata: {
    },
  };
}

function addCoordinatesToGeoJson(geoJson, coordinates) {
  const modifiedGeoJson = geoJson;
  const feature = modifiedGeoJson.features[0];

  let nextIndex = feature.geometry.coordinates.length;
  coordinates.forEach((coordinate) => {
    feature.geometry.coordinates.push(coordinate);
    if (nextIndex > 0) {
      const steepness = 9; // TODO: calculate
      feature.properties.extras.steepness.values.push([nextIndex - 1, nextIndex, steepness]);
    }
    nextIndex += 1;
  });
  return modifiedGeoJson;
}

function mergeGeoJsons(geoJson1, geoJson2) {
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

  const mergedGeoJson = updateGeoJson(
    geoJson1, mergedGeometry, mergedAscent, mergedDescent, mergedDistance,
  );

  return mergedGeoJson;
}

function removeXLastCoordinates(geoJson, X) {
  const modifiedGeoJson = geoJson;
  const feature = modifiedGeoJson.features[0];
  const coords = feature.geometry.coordinates;
  feature.geometry.coordinates = coords.slice(0, coords.length - X);
  return modifiedGeoJson;
}

export {
  emptyGeoJson, addCoordinatesToGeoJson, mergeGeoJsons, removeXLastCoordinates,
};
