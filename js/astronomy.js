import * as Astronomy from "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/+esm";

export const SUN_LEVELS = [
  { key: "day", label: "Daylight", min: 6 },
  { key: "golden", label: "Golden hour", min: -4 },
  { key: "blue", label: "Blue hour", min: -8 },
  { key: "nautical", label: "Nautical twilight", min: -12 },
  { key: "astronomical", label: "Astronomical twilight", min: -18 },
  { key: "night", label: "Night", min: -90 }
];

export function observerFor(location) {
  return new Astronomy.Observer(location.latitude, location.longitude, location.elevation || 0);
}

export function bodyAltitude(body, date, observer) {
  const eq = Astronomy.Equator(body, date, observer, true, true);
  return Astronomy.Horizon(date, observer, eq.ra, eq.dec, "normal").altitude;
}

export function sunAltitude(date, observer) {
  return bodyAltitude(Astronomy.Body.Sun, date, observer);
}

export function moonAltitude(date, observer) {
  return bodyAltitude(Astronomy.Body.Moon, date, observer);
}

export function moonInfo(date) {
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
  return {
    fraction: illum.phase_fraction,
    phaseAngle: illum.phase_angle,
    phase: Astronomy.MoonPhase(date)
  };
}

export const DISPLAY_OBJECTS = [
  { key: "jupiter", name: "Jupiter", body: Astronomy.Body.Jupiter },
  { key: "saturn", name: "Saturn", body: Astronomy.Body.Saturn },
  { key: "venus", name: "Venus", body: Astronomy.Body.Venus },
  { key: "mars", name: "Mars", body: Astronomy.Body.Mars },
  { key: "m42", name: "Orion Nebula (M42)", ra: 5.5881, dec: -5.3911 },
  { key: "m45", name: "Pleiades (M45)", ra: 3.7903, dec: 24.1167 },
  { key: "m31", name: "Andromeda Galaxy (M31)", ra: 0.7123, dec: 41.2692 }
];

function fixedAltitude(ra, dec, date, observer) {
  return Astronomy.Horizon(date, observer, ra, dec, "normal").altitude;
}

export function objectAltitude(object, date, observer) {
  return object.body ? bodyAltitude(object.body, date, observer) : fixedAltitude(object.ra, object.dec, date, observer);
}

export function sampleObjects(samples, observer, objects = DISPLAY_OBJECTS) {
  return objects.map(object => ({
    ...object,
    samples: samples.map(s => ({ date: s.date, altitude: objectAltitude(object, s.date, observer) }))
  }));
}

export function sampleNight(startUtc, endUtc, observer, minutes = 5) {
  const samples = [];
  const stepMs = minutes * 60000;
  for (let t = startUtc.getTime(); t < endUtc.getTime(); t += stepMs) {
    const date = new Date(t);
    samples.push({
      date,
      sunAlt: sunAltitude(date, observer),
      moonAlt: moonAltitude(date, observer)
    });
  }
  samples.push({
    date: new Date(endUtc),
    sunAlt: sunAltitude(endUtc, observer),
    moonAlt: moonAltitude(endUtc, observer)
  });
  return samples;
}

export function crossings(samples, level) {
  const found = [];
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    const da = a.sunAlt - level, db = b.sunAlt - level;
    if ((da <= 0 && db > 0) || (da >= 0 && db < 0)) {
      const f = Math.abs(da) / (Math.abs(da) + Math.abs(db));
      found.push({
        date: new Date(a.date.getTime() + f * (b.date - a.date)),
        rising: b.sunAlt > a.sunAlt
      });
    }
  }
  return found;
}


export function solarEvents(startUtc, observer) {
  const events = [];
  const addAltitude = (altitude, label) => {
    for (const direction of [-1, +1]) {
      const t = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, direction, startUtc, 1.05, altitude);
      if (t) events.push({ date: t.date, label: (direction < 0 ? "Evening " : "Morning ") + label });
    }
  };
  addAltitude(6, "Golden hour (+6°)");
  // For the 0° center crossing, retain the visual boundary definition used by the clock.
  addAltitude(0, "Sun center at horizon");
  addAltitude(-4, "Golden / blue boundary");
  addAltitude(-6, "Civil twilight");
  addAltitude(-8, "Blue-hour boundary");
  addAltitude(-12, "Nautical twilight");
  addAltitude(-18, "Astronomical twilight");
  return events
    .filter(e => e.date >= startUtc && e.date <= new Date(startUtc.getTime() + 25 * 3600000))
    .sort((x, y) => x.date - y.date);
}
