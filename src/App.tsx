import { useState } from "react";
import MapWithRoutePoints from "./mapviewleaflet";
import RouteSelection from "./route-selection"
import type { Route } from "./routing";

function App() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  return (
    <div className="flex flex-col lg:flex-row">
      <MapWithRoutePoints routePoints={[[55.7068, 13.1870], [56.0438, 12.6950]]}/>
      <RouteSelection selectedRoute={selectedRoute} onRouteSelect={setSelectedRoute} />
    </div>
  );
}

export default App;
