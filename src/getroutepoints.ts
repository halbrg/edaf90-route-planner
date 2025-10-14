import polyline  from "@mapbox/polyline";
import type { Route } from "./routing";

function getRoutePoints(route: Route | null): [number, number][] {
  if (!route) return [];

  const allPoints: [number, number][] = [];

  route.forEach((leg) => {
    const decoded = polyline.decode(leg.legGeometry.points);
    allPoints.push(...decoded);
  });

  return allPoints;
}

export {getRoutePoints}