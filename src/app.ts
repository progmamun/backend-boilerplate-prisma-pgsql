import cors from 'cors'
import express, { Application, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import hpp from 'hpp'
import responseTime from 'response-time'
import router from './app/routes'
import { prisma } from './lib/prisma'
import { globalErrorHandler } from './app/middlewares/globalErrorHandler'
import notFound from './app/middlewares/notFound'
import config from './app/config'
import { logger } from './app/utils/logger/logger'
import qs from 'qs'
import path from 'path'
import { uploadDir } from './app/config/upload.config'
import { LogsRoutes } from './app/modules/logger/logs.routes'

// Initialize app
const app: Application = express()
app.set('query parser', (str: string) => qs.parse(str))

app.set('view engine', 'ejs')
app.set('views', path.resolve(process.cwd(), `src/app/templates`))

// Security Middlewares
app.use(helmet())

// Trust proxy (needed when behind nginx/load balancer)
app.set('trust proxy', 1)

// CORS
const corsOptions = {
  origin: config.env === 'production' ? config.cors.origin.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-client-type',
    'Accept',
    'Origin',
  ],
  credentials: true,
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges'],
}
app.use(cors(corsOptions))

// HTTP Parameter Pollution prevention
app.use(hpp())

// Body Parsers
type RawBodyRequest = Request & { rawBody?: Buffer }

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      ;(req as RawBodyRequest).rawBody = buf
    },
  })
)
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(
  '/public',
  express.static(uploadDir, {
    setHeaders: res => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    },
  })
)

// Rate Limiting

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
})

// Strict limiter for auth endpoints (login, register, forgot-password)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
})

app.use('/api', generalLimiter)
app.use('/api/v1/auth/login', authLimiter)
app.use('/api/v1/auth/register', authLimiter)
app.use('/api/v1/auth/forgot-password', authLimiter)
app.use('/api/v1/auth/resend-otp', authLimiter)

// Request Logging
app.use(
  responseTime((req: Request, res: Response, time: number) => {
    const timeInMs = time.toFixed(2)
    const timeCategory =
      time < 100
        ? 'VERY FAST'
        : time < 200
          ? 'FAST'
          : time < 500
            ? 'NORMAL'
            : time < 1000
              ? 'SLOW'
              : time < 5000
                ? 'VERY_SLOW'
                : 'CRITICAL'

    if (!req.path.includes('/stream/')) {
      logger.info({
        message: `${req.method} ${req.originalUrl} ${res.statusCode} - ${timeInMs}ms [${timeCategory}]`,
        method: req.method,
        url: req.originalUrl,
        responseTime: `${timeInMs}ms`,
        timeCategory,
        statusCode: res.statusCode,
      })
    }

    if (time > 1000) {
      logger.warn({
        message: `Slow response: ${req.method} ${req.originalUrl}`,
        responseTime: `${timeInMs}ms`,
        statusCode: res.statusCode,
        alert: 'SLOW_RESPONSE',
      })
    }
  })
)

// Routes

// Root
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: `${config.app.name} v${config.app.version} is running`,
  })
})

// Health check
app.get('/api/v1/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    })
  } catch {
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      database: 'disconnected',
    })
  }
})
// API routes
app.use('/api/v1', router)

//Logger Routes
app.use('/logs', LogsRoutes)

// Global error handler
app.use(globalErrorHandler)

//Not Found
app.use(notFound)

export default app
