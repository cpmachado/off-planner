import ors from 'openrouteservice-js';
import config from '../config.json';

async function getCoordinatesFromLocation(location) {
  const Geocode = new ors.Geocode({
    api_key: config.orsApiKey,
  });

  try {
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
  } catch (error) {
    // console.log('Error in location search', error);
  }
  return null;
}

export { getCoordinatesFromLocation as default };
