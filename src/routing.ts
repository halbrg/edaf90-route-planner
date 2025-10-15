// Not React Router routing, but route planning!

import { OPENTRIPPLANNER_URL } from "./config";
import type { Point } from "./geocoding";

// GraphQL is very nice.
const tripQuery = `
query Trip($origin: PlanLabeledLocationInput!, $destination: PlanLabeledLocationInput!, $time: PlanDateTimeInput) {
  planConnection(
    origin: $origin
    destination: $destination
    searchWindow: "24h"
    dateTime: $time
  ) {
    edges {
      node {
        legs {
          from {
            name
            lon
            lat
            stop {
              platformCode
            }
          }
          to {
            name
            lon
            lat
            stop {
              platformCode
            }
          }
          legGeometry {
            points
          }
          route {
            desc
            shortName
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
  from: {
    name: string;
    lon: number;
    lat: number;
    stop: {
      platformCode: string;
    };
  };
  to: {
    name: string;
    lon: number;
    lat: number;
    stop?: {
      platformCode: string;
    };
  };
  legGeometry: {
    points: string;
  };
  route?: {
    desc: string;
    shortName: string;
  };
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

type Route = Leg[];

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
          label: origin.label,
          location: {
            coordinate: {
              latitude: origin.lat,
              longitude: origin.lon,
            }
          }
        },
        destination: {
          label: destination.label,
          location: {
            coordinate: {
              latitude: destination.lat,
              longitude: destination.lon
            }
          }
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

function extractRoutes(connection: PlanConnection) {
  return connection.data.planConnection.edges.map(edge => edge.node.legs);
}

function keyFromRoute(route: Route) {
  const distance = route.map(leg => leg.distance).reduce((prev, current) => prev + current, 0);
  return `${route[0].start.scheduledTime} ${distance} ${route[route.length - 1].end.scheduledTime}`;
}

function timeFromScheduledTime(scheduledTime: string) {
  return new Date(scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit"});
}

function duration(start: Leg, end: Leg) {
  const startTime = new Date(start.start.scheduledTime).getTime();
  const endTime = new Date(end.end.scheduledTime).getTime();
  let elapsed = endTime - startTime;

  let days = 0;
  while (elapsed >= (24 * 60 * 60 * 1000)) {
    days += 1;
    elapsed -= (24 * 60 * 60 * 1000);
  }

  let hours = 0;
  while (elapsed >= (60 * 60 * 1000)) {
    hours += 1;
    elapsed -= (60 * 60 * 1000);
  }

  let minutes = 0;
  while (elapsed >= (60 * 1000)) {
    minutes += 1;
    elapsed -= (60 * 1000);
  }

  let duration = "";
  if (days > 0) {
    duration += `${days} d`;
  }
  if (hours > 0) {
    if (duration != "") {
      duration += ", ";
    }
    duration += `${hours} hr`;
  }
  if (minutes > 0) {
    if (duration != "") {
      duration += ", ";
    }
    duration += `${minutes} min`;
  }

  return duration;
}

export {
  type PlanConnection,
  type Leg,
  type Route,
  planConnection,
  extractRoutes,
  keyFromRoute,
  timeFromScheduledTime,
  duration,
};
