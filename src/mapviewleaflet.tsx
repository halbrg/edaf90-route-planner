import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
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
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
};

export default function MapWithRoutePoints({
  routePoints,
}: MapWithRoutePointsProps) {
  if (!routePoints || routePoints.length === 0) {
    return <div>No route points provided.</div>;
  }

  const start = routePoints[0];
  const end = routePoints[routePoints.length - 1];

  return (
    <MapContainer
      center={start}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={start} />
      <Marker position={end} />

      <Polyline positions={routePoints} color="blue" weight={5} />

      <FitBounds points={routePoints} />
    </MapContainer>
  );
}
