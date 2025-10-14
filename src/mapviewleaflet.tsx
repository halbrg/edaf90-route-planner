import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface FitBoundsProps {
  points: LatLngExpression[];
}

interface MapWithRoutePointsProps {
  routePoints: LatLngExpression[];
}

const FitBounds = ({ points }: FitBoundsProps) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds);
    }
  }, [map, points]);

  return null;
};

export default function MapWithRoutePoints({
  routePoints,
}: MapWithRoutePointsProps) {
  return (
    <MapContainer
      center={[55.708333, 13.199167]}
      zoom={14}
      style={{ height: "100vh", width: "100vw" }}
      className=""
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {routePoints.length > 0 && (
        <>
          <Marker position={routePoints[0]} />
          <Marker position={routePoints[routePoints.length - 1]} />

          <Polyline positions={routePoints} color="blue" />

          <FitBounds points={routePoints} />
        </>
      )}
    </MapContainer>
  );
}
