export const LOCATIONS = {
  longmont: {
    id: "longmont",
    name: "Longmont, Colorado",
    latitude: 40.1672,
    longitude: -105.1019,
    elevation: 1519,
    timeZone: "America/Denver"
  },
  rmnp: {
    id: "rmnp",
    name: "Rocky Mountain National Park",
    latitude: 40.3428,
    longitude: -105.6836,
    elevation: 2500,
    timeZone: "America/Denver"
  }
};

export function locationFromUrl(params) {
  const id = params.get("location");
  if (id && LOCATIONS[id]) return { ...LOCATIONS[id] };

  const latParam = params.get("lat");
  const lonParam = params.get("lon");
  const lat = latParam === null || latParam === "" ? NaN : Number(latParam);
  const lon = lonParam === null || lonParam === "" ? NaN : Number(lonParam);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return {
      id: "custom",
      name: params.get("name") || "Custom location",
      latitude: lat,
      longitude: lon,
      elevation: Number(params.get("elevation")) || 0,
      timeZone: params.get("tz") || "America/Denver"
    };
  }
  return { ...LOCATIONS.longmont };
}
