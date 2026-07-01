import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { env } from './config/env';
import router from './routes/index';
import { errorMiddleware, notFoundHandler } from './middleware/error.middleware';

const app = express();

// Disable X-Powered-By to prevent framework fingerprinting
app.disable('x-powered-by');

// ── Secure HTTP Headers Middleware ──────────────────────────────
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' ws: wss: http://localhost:5000 http://localhost:5173; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
  );
  
  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

  // Cache Control (sensitive data should not be cached)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Clean common framework information leak headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('X-AspNet-Version');
  res.removeHeader('Server');
  
  next();
});

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const originNormalized = origin.replace(/\/$/, '');
    const clientNormalized = env.CLIENT_URL.replace(/\/$/, '');
    if (originNormalized === clientNormalized) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────────
app.use('/api', router);

// ── Error Handling ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorMiddleware);

// ── Start ────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀  API running on http://localhost:${env.PORT}`);
    console.log(`📦  Environment: ${env.NODE_ENV}`);
  });
}

start();

export default app;
