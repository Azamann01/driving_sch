// Checks whether a given UK postcode falls inside the school's coverage
// radius, using postcodes.io, a free, open, unauthenticated API. No key
// or paid plan is needed for this. See https://postcodes.io for details.

type PostcodesIoResult = {
  status: number;
  result: {
    postcode: string;
    latitude: number;
    longitude: number;
  } | null;
};

function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusMiles = 3958.8;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

async function lookupPostcode(postcode: string) {
  const cleaned = postcode.trim().replace(/\s+/g, "");
  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`
  );

  if (!response.ok) {
    return null;
  }

  const data: PostcodesIoResult = await response.json();
  return data.result;
}

export type CoverageResult =
  | { valid: true; covered: true; distanceMiles: number }
  | { valid: true; covered: false; distanceMiles: number }
  | { valid: false; covered: false; distanceMiles: null };

export async function checkCoverage(
  enteredPostcode: string,
  basePostcode: string,
  coverageRadiusMiles: number
): Promise<CoverageResult> {
  const [entered, base] = await Promise.all([
    lookupPostcode(enteredPostcode),
    lookupPostcode(basePostcode),
  ]);

  if (!entered || !base) {
    return { valid: false, covered: false, distanceMiles: null };
  }

  const distanceMiles = haversineDistanceMiles(
    entered.latitude,
    entered.longitude,
    base.latitude,
    base.longitude
  );

  return {
    valid: true,
    covered: distanceMiles <= coverageRadiusMiles,
    distanceMiles: Math.round(distanceMiles * 10) / 10,
  };
}
