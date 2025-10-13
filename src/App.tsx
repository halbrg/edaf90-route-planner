import MapWithRoutePoints from "./mapviewleaflet";
import RouteSelection from "./route-selection"

function App() {
  return (
    <>
      <MapWithRoutePoints routePoints={[[55.7068, 13.1870], [56.0438, 12.6950]]}/>
      <RouteSelection />
    </>
  );
}

export default App;
