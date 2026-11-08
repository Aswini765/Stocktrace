/**
 * StockTrace production server (same pattern as AeroDAG's server.ts):
 * security headers, health probe, static hosting of the Vite build with SPA fallback.
 * All StockTrace data lives in the browser for this demo; there is no backend database yet.
 */
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"
  );
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    service: 'StockTrace short-supply resolution',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

const dist = path.join(__dirname, 'dist');
app.use(express.static(dist, { maxAge: '1h', index: false }));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`StockTrace listening on http://localhost:${port}`);
});
