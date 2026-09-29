# Astronomical Clock

A browser-based noon-to-noon astronomical planning clock designed for public astronomy programs and Google Sites embedding.

## V0.1

- Named observing locations with latitude, longitude, elevation, and IANA timezone
- Noon-to-noon local civil-time clock
- Daylight, golden hour, blue hour, civil, nautical, and astronomical twilight
- Moon altitude track, illumination, and phase
- Date picker plus ±1, ±7, ±30 and arbitrary-day navigation
- DST-aware display using the browser's IANA timezone support
- URL parameters for embedding/bookmarking

## Run locally

Because the app uses ES modules, serve the repository rather than opening index.html directly:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## URL parameters

Example:

```
?location=longmont&date=2026-09-29&embed=1
```

Custom coordinates can be supplied with `name`, `lat`, `lon`, `elevation`, and `tz`.

## Definitions

Twilight boundaries use solar-center altitude:
- Civil: -6°
- Nautical: -12°
- Astronomical: -18°

The display treats golden hour as Sun altitude -4° to +6° and blue hour as -8° to -4°. These photographic periods overlap formal twilight by design.

Astronomical calculations use Astronomy Engine. Civil-time formatting uses IANA time zones via `Intl.DateTimeFormat`.
