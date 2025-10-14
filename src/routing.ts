// Not React Router routing, but route planning!

import { OPENTRIPPLANNER_URL } from "./config";
import type { Point } from "./geocoding";

// GraphQL is very nice.
const tripQuery = `
query Trip($origin: PlanCoordinateInput, $destination: PlanCoordinateInput, $time: PlanDateTimeInput) {
  planConnection(
    origin: {label: "Start", location: {coordinate: $origin}}
    destination: {label: "End", location: {coordinate: $destination}}
    searchWindow: "24h"
    dateTime: $time
  ) {
    edges {
      node {
        legs {
          legGeometry {
            points
          }
          distance
          mode
          start {
            scheduledTime
          }
          end {
            scheduledTime
          }
        }
      }
    }
  }
}
`;

type PlanConnection = {
  data: {
    planConnection: {
      edges: {
        node: {
          legs: Leg[]
        };
      }[];
    };
  };
};

type Leg = {
  from: Point;
  to: Point;
  legGeometry: {
    points: string;
  }[];
  distance: number;
  mode:
  "AIRPLANE" |
  "BICYCLE" |
  "BUS" |
  "CABLE_CAR" |
  "CAR" |
  "CARPOOL" |
  "COACH" |
  "FERRY" |
  "FLEX" |
  "FUNICULAR" |
  "GONDOLA" |
  "MONORAIL" |
  "RAIL" |
  "SCOOTER" |
  "SUBWAY" |
  "TAXI" |
  "TRAM" |
  "TRANSIT" |
  "TROLLEYBUS" |
  "WALK";
  start: {
    scheduledTime: string;
  };
  end: {
    scheduledTime: string;
  };
};

async function planConnection(origin: Point, destination: Point, departure: boolean, time: Date) {
  return fetch(OPENTRIPPLANNER_URL, {
    method: "POST",
    headers: {
      "Accept-Language": "sv",
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      query: tripQuery,
      variables: {
        origin: {
          latitude: origin.lat,
          longitude: origin.lon,
        },
        destination: {
          latitude: destination.lat,
          longitude: destination.lon
        },
        time: {
          [departure ? "earliestDeparture" : "latestArrival"]: time.toISOString()
        }
      }
    })
  }).then((res: Response) => {
    if (res.ok) {
      return res.json();
    } else {
      throw res;
    }
  });
}

function getLegs(connection: PlanConnection) {
  return connection.data.planConnection.edges.map(edge => edge.node.legs);
}

export {
  type PlanConnection,
  type Leg,
  planConnection,
  getLegs
};
