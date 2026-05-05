const Module = require('module');
const m = new Module('', null);
m.paths = Module._nodeModulePaths(require('path').join(__dirname, 'node_modules/gatsby-sharp'));
const sharp = m.require('sharp');
const fs = require('fs');
const path = require('path');

const staticDir = path.join(__dirname, 'static');

async function generateAssets() {
  // 1. Generate favicon.svg (simplified bolt)
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="8" fill="#111111"/>
  <path d="M 19 4 L 9 17 L 15 17 L 13 28 L 24 13 L 17 13 Z" fill="#FF7300"/>
</svg>`;
  fs.writeFileSync(path.join(staticDir, 'favicon.svg'), faviconSvg);
  console.log('✓ favicon.svg');

  // 2. Generate OG image (1200x630) as SVG, convert to PNG
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="bolt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff9900"/>
      <stop offset="100%" stop-color="#e65c00"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.5"/>
  
  <!-- Bolt icon left -->
  <g transform="translate(80, 115) scale(3)">
    <path d="M 60 10 L 20 70 L 50 70 L 40 120 L 90 55 L 55 55 Z" fill="url(#bolt)"/>
  </g>
  
  <!-- Connection lines (network graph) -->
  <g stroke="#ff730033" stroke-width="1.5" fill="none">
    <line x1="380" y1="200" x2="500" y2="150"/>
    <line x1="500" y1="150" x2="600" y2="220"/>
    <line x1="600" y1="220" x2="520" y2="350"/>
    <line x1="380" y1="200" x2="520" y2="350"/>
    <line x1="500" y1="150" x2="700" y2="100"/>
    <line x1="600" y1="220" x2="750" y2="280"/>
    <line x1="520" y1="350" x2="680" y2="400"/>
    <line x1="700" y1="100" x2="850" y2="160"/>
    <line x1="750" y1="280" x2="900" y2="200"/>
  </g>
  <g fill="#ff730066">
    <circle cx="380" cy="200" r="5"/>
    <circle cx="500" cy="150" r="7"/>
    <circle cx="600" cy="220" r="6"/>
    <circle cx="520" cy="350" r="8"/>
    <circle cx="700" cy="100" r="5"/>
    <circle cx="750" cy="280" r="6"/>
    <circle cx="680" cy="400" r="7"/>
    <circle cx="850" cy="160" r="5"/>
    <circle cx="900" cy="200" r="6"/>
  </g>
  
  <!-- Title -->
  <text x="420" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="800" fill="#ffffff" letter-spacing="-2">
    Bobbie Intelligence
  </text>
  <text x="420" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#888888" letter-spacing="1">
    AUTONOMOUS INTELLIGENCE TERMINAL
  </text>
  
  <!-- Bottom bar -->
  <rect x="0" y="610" width="1200" height="20" fill="#FF7300" opacity="0.8"/>
</svg>`;

  const ogPng = await sharp(Buffer.from(ogSvg))
    .png()
    .toFile(path.join(staticDir, 'og-image.png'));
  console.log(`✓ og-image.png (${ogPng.width}x${ogPng.height})`);

  // 3. Generate apple-touch-icon (180x180)
  const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#222222"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="bolt2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff9900"/>
      <stop offset="100%" stop-color="#e65c00"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="40" fill="url(#bg2)"/>
  <path d="M 105 35 L 50 95 L 85 95 L 72 150 L 135 78 L 95 78 Z" fill="url(#bolt2)"/>
</svg>`;

  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(staticDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180x180)');

  // 4. Generate favicon.ico (32x32 PNG wrapped)
  await sharp(Buffer.from(appleSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(staticDir, 'favicon-32x32.png'));
  console.log('✓ favicon-32x32.png');

  // 5. Generate favicon-16x16
  await sharp(Buffer.from(appleSvg))
    .resize(16, 16)
    .png()
    .toFile(path.join(staticDir, 'favicon-16x16.png'));
  console.log('✓ favicon-16x16.png');

  // 6. Android chrome 192x192
  await sharp(Buffer.from(appleSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(staticDir, 'android-chrome-192x192.png'));
  console.log('✓ android-chrome-192x192.png');

  // 7. Generate site.webmanifest
  const manifest = {
    name: "Bobbie Intelligence",
    short_name: "Bobbie",
    description: "Autonomous Intelligence Terminal",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }
    ],
    theme_color: "#FF7300",
    background_color: "#111111",
    display: "standalone",
    start_url: "/"
  };
  fs.writeFileSync(path.join(staticDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('✓ site.webmanifest');

  // 8. robots.txt
  const robots = `User-agent: *
Allow: /

Sitemap: https://solo.engineer/sitemap.xml
`;
  fs.writeFileSync(path.join(staticDir, 'robots.txt'), robots);
  console.log('✓ robots.txt');
}

generateAssets().catch(console.error);
