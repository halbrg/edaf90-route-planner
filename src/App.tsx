import { useState } from "react";
import MapWithRoutePoints from "./mapviewleaflet";
import RouteSelection from "./route-selection";
import type { Route } from "./routing";
import { getRouteSegments } from "./getroutepoints";

function App() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  return (
    <div className="flex flex-col lg:flex-row">
      <MapWithRoutePoints routeSegments={getRouteSegments(selectedRoute)} />
      <RouteSelection
        selectedRoute={selectedRoute}
        onRouteSelect={setSelectedRoute}
      />
    </div>
  );
}

export default App;
