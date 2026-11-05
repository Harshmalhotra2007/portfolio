const crypto = require('crypto');
const https = require('https');

function fetchResource(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchResource(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  const js = await fetchResource('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  const css = await fetchResource('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  console.log('JS  sha256: ' + crypto.createHash('sha256').update(js).digest('base64'));
  console.log('CSS sha256: ' + crypto.createHash('sha256').update(css).digest('base64'));
}
main().catch((e) => console.error(e.message));
