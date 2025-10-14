import { useState } from "react";
import MapWithRoutePoints from "./mapviewleaflet";
import RouteSelection from "./route-selection"
import type { Route } from "./routing";
import polyline from '@mapbox/polyline';

function getRoutePoints(route: Route | null): [number, number][] {
if (!route) return [];

  const allPoints: [number, number][] = [];

  route.forEach((leg) => {
    const decoded = polyline.decode(leg.legGeometry.points);
    allPoints.push(...decoded);
  });

  return allPoints;
}

function App() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  return (
    <div className="flex flex-col lg:flex-row">
      <MapWithRoutePoints routePoints={getRoutePoints(selectedRoute)}/>
      <RouteSelection selectedRoute={selectedRoute} onRouteSelect={setSelectedRoute} />
    </div>
  );
}

export default App;
