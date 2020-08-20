import ors from 'openrouteservice-js';
import config from '../config.json';

async function getCoordinatesFromLocation(location) {
  const Geocode = new ors.Geocode({
    api_key: config.orsApiKey,
  });

  const result = await Geocode.geocode({
    text: location,
  });
  if (
    result && result.features && result.features[0] && result.features[0].geometry
      && result.features[0].geometry.coordinates
  ) {
    const [longitude, latitude] = result.features[0].geometry.coordinates;
    return { longitude, latitude };
  }

  return null;
}

async function getSegmentsFor2pointsDirection(point1, point2, profile = 'foot-hiking') {
  const Directions = new ors.Directions({
    api_key: config.orsApiKey,
  });
  const options = {
    coordinates: [point1, point2],
    profile,
    format: 'geojson',
    elevation: true,
    extra_info: ['steepness'],
  };
  const result = await Directions.calculate(options);
  if (result && result.features && result.features[0]) {
    const feature = result.features[0];
    if (feature.geometry && Array.isArray(feature.geometry.coordinates)) {
      const { coordinates } = feature.geometry;
      return coordinates;
    }
  }
  return [];
}

async function getAltitude(coordinates) {
  const Elevation = new ors.Elevation({
    api_key: config.orsApiKey,
  });
  const result = await Elevation.pointElevation({
    format_in: 'point',
    format_out: 'point',
    geometry: coordinates,
  });
  if (result && result.geometry) {
    const [,, altitude] = result.geometry;
    return altitude || 0;
  }
  return 0;
}

async function getLineAltitude(coordinates) {
  const Elevation = new ors.Elevation({
    api_key: config.orsApiKey,
  });
  const result = await Elevation.lineElevation({
    format_in: 'polyline',
    format_out: 'polyline',
    geometry: coordinates,
  });
  if (result && result.geometry) {
    return result.geometry;
  }
  return [];
}

export {
  getCoordinatesFromLocation, getSegmentsFor2pointsDirection, getAltitude, getLineAltitude,
};
