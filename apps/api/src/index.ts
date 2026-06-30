import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { env } from './config/env';
import router from './routes/index';
import { errorMiddleware, notFoundHandler } from './middleware/error.middleware';

const app = express();

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const originNormalized = origin.replace(/\/$/, '');
    const clientNormalized = env.CLIENT_URL.replace(/\/$/, '');
    if (originNormalized === clientNormalized) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
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
