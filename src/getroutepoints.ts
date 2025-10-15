import polyline from "@mapbox/polyline";
import type { Route } from "./routing";

function getRouteSegments(route: Route | null) {
  if (!route) return [];

  return route.map((leg) => {
    const decoded = polyline.decode(leg.legGeometry.points);
    return {
      mode: leg.mode,
      points: decoded,
    };
  });
}

function getColorForMode(mode: string): string {
  switch (mode) {
    case "BUS":
      return "green";
    case "RAIL":
      return "red";
    case "TRAM":
      return "gray";
    case "WALK":
      return "black";
    default:
      return "blue";
  }
}

export { getRouteSegments, getColorForMode };
