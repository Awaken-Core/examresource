import { BadRequestException } from '@nestjs/common';
import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Checks if an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * or other reserved/internal ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const cleanIp = ip.trim();

  // IPv4 checks
  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    const [a, b] = parts;

    // 0.0.0.0/8 (Current network / "this" host)
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata service e.g. 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && parts[2] === 0) return true;
    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && parts[2] === 2) return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && parts[2] === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && parts[2] === 113) return true;
    // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 (Reserved / Future use)
    if (a >= 240) return true;
    // 255.255.255.255 (Broadcast)
    if (cleanIp === '255.255.255.255') return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(cleanIp)) {
    const normalized = cleanIp.toLowerCase();
    // Loopback
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
    // Unspecified
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
    // Unique local address (fc00::/7)
    if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;
    // Link-local unicast (fe80::/10)
    if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;
    // IPv4-mapped IPv6 (::ffff:0:0/96)
    const ipv4Mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (ipv4Mapped && ipv4Mapped[1]) {
      return isPrivateOrReservedIp(ipv4Mapped[1]);
    }

    return false;
  }

  return true;
}

/**
 * Validates that a URL is safe to fetch by asserting it uses HTTP/HTTPS,
 * does not point to internal/loopback hostnames or private IP addresses,
 * and resolves only to non-reserved public IP addresses.
 */
export async function assertSafeRemoteUrl(urlString: string): Promise<URL> {
  const clean = urlString.trim();
  if (!clean) {
    throw new BadRequestException('A valid URL is required.');
  }

  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    throw new BadRequestException('Invalid URL format.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestException('Only HTTP and HTTPS protocols are allowed.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Deny internal / local hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.onion') ||
    hostname === 'metadata.google.internal'
  ) {
    throw new BadRequestException('Access to internal hostnames is prohibited.');
  }

  // Check for raw integer, octal, or hex IPv4 notation (e.g. 2130706433, 0177.0.0.1, 0x7f000001)
  if (/^(?:0x[0-9a-f]+|\d+)$/i.test(hostname) || /^(?:0[0-7]+|\d+)(?:\.(?:0[0-7]+|\d+)){1,3}$/.test(hostname)) {
    throw new BadRequestException('Alternative IP formats are not permitted.');
  }

  // If hostname is directly an IP address, validate immediately
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new BadRequestException('Access to private or local network addresses is prohibited.');
    }
    return parsed;
  }

  // Perform DNS lookup to resolve the actual IP address
  try {
    const lookupResult = await dns.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      throw new BadRequestException('Failed to resolve host address.');
    }

    for (const entry of lookupResult) {
      if (isPrivateOrReservedIp(entry.address)) {
        throw new BadRequestException('Destination resolves to a prohibited internal network address.');
      }
    }
  } catch (err: any) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException(`Could not resolve host: ${err?.message || 'Host unreachable'}`);
  }

  return parsed;
}

