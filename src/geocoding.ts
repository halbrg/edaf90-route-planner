import { PELIAS_URL } from "./config";

type PeliasAutocompleteResponse = {
  features: {
    properties: {
      id: string;
      name: string;
      county: string;
    }
  }[];
};

type PeliasSearchResponse = {
  features: {
    geometry: {
      coordinates: number[];
    }
  }[];
  geocoding: {
    query: {
      text: string;
    }
  };
};

type SearchError = {
  type: "network" | "validation";
  msg?: string;
  res?: Response;
};

type Point = {
  lon: number;
  lat: number;
};

async function search(text: string) {
  return fetch(PELIAS_URL + "/search?" + new URLSearchParams({
    text: text,
    layers: "venue,address",
    size: "1",
    "boundary.gid": "whosonfirst:region:85688377", // Keep searches contained within Skåne
    "focus.point.lat": "55.7029296", // Focus on Lund
    "focus.point.lon": "13.1929449",
  }).toString(), {
    headers: {
      "Accept-Language": "sv",
      "Accept": "application/json"
    }
  })
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw { type: "network", res: res };
      }
    });
}

async function autocomplete(text: string) {

  return fetch(PELIAS_URL + "/autocomplete?" + new URLSearchParams({
    text: text,
    layers: "venue,address",
    size: "5",
    "boundary.gid": "whosonfirst:region:85688377", // Keep searches contained within Skåne
    "focus.point.lat": "55.7029296", // Focus on Lund
    "focus.point.lon": "13.1929449",
  }).toString(), {
    headers: {
      "Accept-Language": "sv",
      "Accept": "application/json"
    }
  })
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw res;
      }
    });
}

function ensureFeatures([origin, destination]: PeliasSearchResponse[]) {
  let error = "";

  if (origin.features.length != 1) {
    error += origin.geocoding.query.text;
  }
  if (destination.features.length != 1) {
    if (error.length > 0) {
      error += " or ";
    }
    error += destination.geocoding.query.text;
  }
  if (error) {
    throw { type: "validation", msg: `Could not find ${error}.` };
  }

  return [origin, destination];
}

function getPoints([origin, destination]: PeliasSearchResponse[]) {
  const [originLon, originLat] = origin.features[0].geometry.coordinates;
  const [destinationLon, destinationLat] = destination.features[0].geometry.coordinates;
  return {
    origin: { lon: originLon, lat: originLat },
    destination: { lon: destinationLon, lat: destinationLat }
  };
}

export {
  type PeliasAutocompleteResponse,
  type PeliasSearchResponse,
  type SearchError,
  type Point,
  search,
  autocomplete,
  ensureFeatures,
  getPoints
};