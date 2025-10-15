import { useState } from "react";
import MapWithRoutePoints from "./mapviewleaflet";
import RouteSelection from "./route-selection";
import type { Route } from "./routing";
import { getRoutePoints, getRouteColor } from "./getroutepoints";

function App() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  return (
    <div className="flex flex-col lg:flex-row">
      <MapWithRoutePoints
        routePoints={getRoutePoints(selectedRoute)}
        color={getRouteColor(selectedRoute)}
      />
      <RouteSelection
        selectedRoute={selectedRoute}
        onRouteSelect={setSelectedRoute}
      />
    </div>
  );
}

export default App;
