function stripIpv4MappedPrefix(ip: string): string {
  const trimmed = ip.trim();
  if (trimmed.toLowerCase().startsWith('::ffff:')) {
    return trimmed.slice(7);
  }
  return trimmed;
}

export function isPrivateOrLocalIp(rawIp: string): boolean {
  const ip = stripIpv4MappedPrefix(rawIp);
  if (!ip) return true;

  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === 'localhost' || lower === '0.0.0.0') return true;
  if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;

  // Strip port if an IPv4:port string was passed
  const ipv4Candidate = ip.includes('.') && ip.includes(':') ? ip.split(':')[0] : ip;
  const parts = ipv4Candidate.split('.').map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    return false;
  }

  // Public IPv6 heuristic (has colons and not loopback/ULA/link-local)
  return !ip.includes(':');
}

export function extractPublicClientIp(
  forwardedFor: string | string[] | undefined,
  realIp?: string | string[] | undefined,
  remoteAddress?: string | undefined
): string | null {
  const candidates: string[] = [];

  const pushHeader = (val: string | string[] | undefined) => {
    if (!val) return;
    const list = Array.isArray(val) ? val : [val];
    for (const entry of list) {
      for (const part of entry.split(',')) {
        const cleaned = stripIpv4MappedPrefix(part);
        if (cleaned) candidates.push(cleaned);
      }
    }
  };

  pushHeader(forwardedFor);
  pushHeader(realIp);
  if (remoteAddress) {
    candidates.push(stripIpv4MappedPrefix(remoteAddress));
  }

  for (const ip of candidates) {
    if (!isPrivateOrLocalIp(ip)) {
      return ip;
    }
  }
  return null;
}

export interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  region?: string;
  country?: string;
}

export function formatNominatimPlace(address?: NominatimAddress | null): {
  name: string;
  state: string;
  country: string;
} {
  if (!address) {
    return { name: 'Current Location', state: 'Detected Coordinates', country: 'Detected' };
  }
  const name =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.state_district ||
    address.county ||
    'Current Location';

  const state = address.state || address.region || address.country || 'Detected Region';
  const country = address.country || 'Detected';
  return { name, state, country };
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
