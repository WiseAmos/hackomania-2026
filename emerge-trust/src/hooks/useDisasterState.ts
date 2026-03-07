import { useDisasterStore } from "@/store/disasterStore";
import type { DisasterZone } from "@/types";

interface UseDisasterStateReturn {
  activeZones: DisasterZone[];
  isInActiveZone: (lat: number, lng: number) => boolean;
  hasActiveDisaster: boolean;
}

function pointInPolygon(
  lat: number,
  lng: number,
  polygon: { lat: number; lng: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

export function useDisasterState(): UseDisasterStateReturn {
  const { zones, activeZoneIds } = useDisasterStore();

  const activeZones = zones.filter((z) => z.status === "active");

  const isInActiveZone = (lat: number, lng: number): boolean => {
    return activeZones.some((zone) =>
      pointInPolygon(lat, lng, zone.geofence)
    );
  };

  return {
    activeZones,
    isInActiveZone,
    hasActiveDisaster: activeZoneIds.length > 0,
  };
}
