import { useState } from "react";
import MapWithRoutePoints from "./mapviewleaflet";
import RouteSelection from "./route-selection"
import type { Leg } from "./routing";
import polyline from '@mapbox/polyline';

function getRoutePoints(selectedRoute: Leg[]): [number, number][] {
  const allPoints: [number, number][] = [];

  selectedRoute.forEach((leg) => {
    leg.legGeometry.forEach((geometry) => {
      const decoded = polyline.decode(geometry.points);
      allPoints.push(...decoded);
    });
  });

  return allPoints;
}

function App() {
  const [selectedRoute, setSelectedRoute] = useState<Leg[]>([]);
  
  return (
    <div className="flex flex-col lg:flex-row">
      <MapWithRoutePoints routePoints={getRoutePoints(selectedRoute)}/>
      <RouteSelection selectedRoute={selectedRoute} onRouteSelect={setSelectedRoute} />
    </div>
  );
}

export default App;
