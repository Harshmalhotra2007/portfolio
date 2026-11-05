const crypto = require('crypto');
const https = require('https');

const resources = [
  // FontAwesome
  { name: 'Font Awesome CSS', url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', type: 'style' },
  // Lenis
  { name: 'Lenis Smooth Scroll', url: 'https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.19/bundled/lenis.min.js', type: 'script' },
  // Lucide Icons (pinned version)
  { name: 'Lucide Icons', url: 'https://cdn.jsdelivr.net/npm/lucide@0.432.0', type: 'script' },
  // Chart.js (pinned version)
  { name: 'Chart.js', url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js', type: 'script' },
  // Leaflet CSS
  { name: 'Leaflet CSS', url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', type: 'style' },
  // Leaflet JS
  { name: 'Leaflet JS', url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', type: 'script' },
  // Google Fonts CSS (with display=swap and optimized weights)
  { name: 'Google Fonts CSS', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400;700&display=swap', type: 'style' },
];

function fetchResource(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : require('http');
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchResource(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}: status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  for (const res of resources) {
    try {
      const data = await fetchResource(res.url);
      const hash = crypto.createHash('sha384').update(data).digest('base64');
      console.log(`${res.name} (${res.url})`);
      console.log(`integrity="sha384-${hash}"`);
      console.log('---');
    } catch (err) {
      console.error(`Error fetching ${res.name} (${res.url}): ${err.message}`);
    }
  }
}

main();