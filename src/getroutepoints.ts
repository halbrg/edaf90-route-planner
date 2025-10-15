import polyline from "@mapbox/polyline";
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

function getRouteColor(route: Route | null): string {
  if (!route) return "";
  let currentColor: string = "";

  route.forEach((leg) => {
    switch (leg.mode) {
      case "BUS":
        currentColor = "green";
        break;
      case "RAIL":
        currentColor = "red";
        break;
      case "TRAM":
        currentColor = "gray";
        break;
      case "WALK":
        currentColor = "black";
        break;
      default:
        currentColor = "blue";
    }
  });
  return currentColor;
}

export { getRoutePoints, getRouteColor };
