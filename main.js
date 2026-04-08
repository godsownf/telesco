import fs from 'fs';
import { launchTest } from '@cloudflare/telescope';

// Load auth and cookies
const auth = JSON.parse(fs.readFileSync('auth.json', 'utf-8'));
const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8'));

const result = await launchTest({
    url: 'https://plymouthcouncil.office.cloud/',
    browser: 'chrome',
    headless: true,

    // Core fingerprint identity
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezone: 'Africa/Lagos',

    // Screen / hardware
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',

    // Geolocation
    geolocation: { latitude: 6.5244, longitude: 3.3792, accuracy: 50 },

    // Network
    network: { offline: false, latency: 40, downloadThroughput: 8 * 1024 * 1024, uploadThroughput: 3 * 1024 * 1024 },

    // Headers
    headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1',
        'Sec-CH-UA': '"Chromium";v="120", "Not:A-Brand";v="99"',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-CH-UA-Mobile': '?0',
    },

    // Cookies
    cookies,

    // JS fingerprint overrides
    evaluateOnNewDocument: `
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return 'Intel Inc.';
      if (param === 37446) return 'Intel Iris OpenGL Engine';
      return getParameter.call(this, param);
    };

    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
      const ctx = this.getContext('2d');
      ctx.fillText('fingerprint-noise', 0, 0);
      return toDataURL.apply(this, arguments);
    };
  `,

    permissions: ['geolocation', 'notifications'],
    media: { devices: [{ kind: 'videoinput', label: 'HD Webcam' }, { kind: 'audioinput', label: 'Microphone' }] },

    // Behavior simulation
    actions: [
        { type: 'moveMouse', x: 300, y: 400 },
        { type: 'scroll', x: 0, y: 800 },
        { type: 'click', selector: 'body' },
        { type: 'wait', ms: 1200 },
    ],

    // Timing
    delay: 500,
    waitUntil: 'networkidle',

    // Auth
    auth,

    debug: true,
});

if (!result.success) {
    console.error('Test failed:', result.error);
} else {
    console.log('Test succeeded:', result.testId);
    console.log('Results saved to:', result.resultsPath);
}
