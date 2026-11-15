const net = require('net');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Checks if an IPv4 or IPv6 string falls into private, loopback, link-local,
 * multicast, carrier-grade NAT, or cloud metadata IP ranges.
 */
function isPrivateIp(ip) {
  if (!ip || typeof ip !== 'string') return true;

  const normalized = ip.trim().toLowerCase();

  // 1. IPv4-mapped IPv6 bypass check (e.g., ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (normalized.startsWith('::ffff:')) {
    const mappedIpv4 = normalized.substring(7);
    if (mappedIpv4.includes('.')) {
      return isPrivateIp(mappedIpv4);
    }
  }

  // 2. IPv6 checks
  if (normalized.includes(':')) {
    // Loopback
    if (normalized === '::1' || normalized === '::') return true;
    // Unique local address (fc00::/7 -> fc00 to fdff)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    // Link-local unicast (fe80::/10 -> fe80 to febf)
    if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
    // Multicast (ff00::/8)
    if (normalized.startsWith('ff')) return true;
    return false;
  }

  // 3. IPv4 checks
  const parts = normalized.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 is treated as private/unsafe
  }

  const [p0, p1, p2, p3] = parts;

  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;

  // 10.0.0.0/8 (Private)
  if (p0 === 10) return true;

  // 100.64.0.0/10 (Shared Address Space / Carrier-Grade NAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;

  // 169.254.0.0/16 (Link-Local, AWS/GCP/Azure Metadata Services 169.254.169.254)
  if (p0 === 169 && p1 === 254) return true;

  // 172.16.0.0/12 (Private)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (p0 === 192 && p1 === 0 && p2 === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (p0 === 192 && p1 === 0 && p2 === 2) return true;

  // 192.168.0.0/16 (Private)
  if (p0 === 192 && p1 === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (p0 === 198 && p1 === 51 && p2 === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (p0 === 203 && p1 === 0 && p2 === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (p0 >= 224 && p0 <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future Use)
  if (p0 >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (p0 === 255 && p1 === 255 && p2 === 255 && p3 === 255) return true;

  return false;
}

/**
 * Validates a target URL against SSRF vulnerabilities:
 * - Scheme must be http: or https:
 * - Hostname cannot be localhost, metadata services, or private IPs
 * - Resolves all DNS records and rejects if ANY resolved IP is private/local
 */
async function validateUrlForSsrf(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl.trim());
  } catch (err) {
    throw new Error('Malformed URL');
  }

  // 1. Only allow HTTP and HTTPS
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are permitted.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 2. Reject obvious local / internal hostnames
  const blockedHostnames = [
    'localhost',
    'localhost.localdomain',
    'metadata.google.internal',
    'metadata',
    'instance-data'
  ];
  if (blockedHostnames.includes(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.internal')) {
    throw new Error(`Access to internal host '${hostname}' is prohibited`);
  }

  // 3. If hostname is already an IP literal, validate directly
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error(`Direct connection to private/local IP '${hostname}' is prohibited`);
    }
    return {
      parsedUrl,
      validatedAddresses: [hostname]
    };
  }

  // 4. DNS resolution: resolve all IPv4 and IPv6 addresses for the hostname
  let addresses = [];
  try {
    const results = await dns.lookup(hostname, { all: true });
    addresses = results.map(r => r.address);
  } catch (dnsErr) {
    throw new Error(`DNS resolution failed for host '${hostname}': ${dnsErr.message}`);
  }

  if (addresses.length === 0) {
    throw new Error(`No DNS records found for host '${hostname}'`);
  }

  // 5. Verify every resolved IP address is strictly public
  for (const addr of addresses) {
    if (isPrivateIp(addr)) {
      throw new Error(`Host '${hostname}' resolved to prohibited address '${addr}'`);
    }
  }

  return {
    parsedUrl,
    validatedAddresses: addresses
  };
}

/**
 * Fetches an external HTML document safely:
 * - DNS resolution & SSRF validation
 * - Validates redirect destinations against SSRF
 * - Strict timeout (default 7 seconds)
 * - Response size limit (default 3MB)
 * - Validates content-type is HTML / text
 */
function safeFetchHtml(rawUrl, options = {}) {
  const maxRedirects = options.maxRedirects || 3;
  const timeoutMs = options.timeoutMs || 7000;
  const maxBytes = options.maxBytes || 3 * 1024 * 1024; // 3MB limit
  const userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Alumnex-Connect-Fetcher/1.0';

  return new Promise(async (resolve, reject) => {
    let currentUrl = rawUrl;
    let redirectCount = 0;

    const executeFetch = async (targetUrl) => {
      let validation;
      try {
        validation = await validateUrlForSsrf(targetUrl);
      } catch (err) {
        return reject(err);
      }

      const parsed = validation.parsedUrl;
      const isHttps = parsed.protocol === 'https:';
      const transport = isHttps ? https : http;

      const requestOptions = {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9',
          'Accept-Language': 'en-US,en;q=0.8'
        },
        timeout: timeoutMs
      };

      const req = transport.request(requestOptions, (res) => {
        // Handle HTTP Redirects securely
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          redirectCount++;
          if (redirectCount > maxRedirects) {
            req.destroy();
            return reject(new Error(`Maximum redirect limit of ${maxRedirects} exceeded`));
          }

          let redirectTarget;
          try {
            redirectTarget = new URL(res.headers.location, targetUrl).toString();
          } catch (e) {
            req.destroy();
            return reject(new Error('Invalid redirect location URL'));
          }

          req.destroy();
          return executeFetch(redirectTarget);
        }

        // Validate status code
        if (res.statusCode < 200 || res.statusCode >= 300) {
          req.destroy();
          return reject(new Error(`Target responded with HTTP status ${res.statusCode}`));
        }

        // Validate Content-Type
        const contentType = (res.headers['content-type'] || '').toLowerCase();
        const allowedTypes = ['text/html', 'application/xhtml+xml', 'text/plain'];
        const isAllowedType = allowedTypes.some(type => contentType.includes(type));
        if (contentType && !isAllowedType) {
          req.destroy();
          return reject(new Error(`Invalid content-type '${contentType}'. Expected HTML/text.`));
        }

        // Validate Content-Length if present
        const contentLength = parseInt(res.headers['content-length'], 10);
        if (contentLength && contentLength > maxBytes) {
          req.destroy();
          return reject(new Error(`Content-Length (${contentLength} bytes) exceeds limit of ${maxBytes} bytes`));
        }

        let body = '';
        let totalBytes = 0;

        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          totalBytes += Buffer.byteLength(chunk, 'utf8');
          if (totalBytes > maxBytes) {
            req.destroy();
            return reject(new Error(`Response size exceeded limit of ${maxBytes} bytes`));
          }
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            html: body,
            finalUrl: targetUrl,
            contentType,
            statusCode: res.statusCode
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      });

      req.on('error', (err) => {
        reject(new Error(`Network error during fetch: ${err.message}`));
      });

      req.end();
    };

    executeFetch(currentUrl);
  });
}

module.exports = {
  isPrivateIp,
  validateUrlForSsrf,
  safeFetchHtml
};
