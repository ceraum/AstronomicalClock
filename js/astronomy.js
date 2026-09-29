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

export function sampleNight(startUtc, observer, minutes = 5) {
  const samples = [];
  for (let m = 0; m <= 24 * 60; m += minutes) {
    const date = new Date(startUtc.getTime() + m * 60000);
    samples.push({
      date,
      sunAlt: sunAltitude(date, observer),
      moonAlt: moonAltitude(date, observer)
    });
  }
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
