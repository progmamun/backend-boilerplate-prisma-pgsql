import { Server } from 'http'
import app from './app'
import { redisService } from './lib/redis'
import { logger } from './app/utils/logger/logger'
import config from './app/config'

let server: Server

const bootstrap = async () => {
  try {
    // Connect Redis
    await redisService.connect()
    logger.info('✅ Redis connected successfully')

    // Start Server
    server = app.listen(config.port, config.host, () => {
      logger.info(
        `🚀 Server running on http://${config.host}:${config.port} [${config.env}]`
      )

      logger.info(`📄 API Docs: http://${config.host}:${config.port}/api/docs`)
    })

    // Server error handler
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${config.port} is already in use`)
      } else {
        logger.error(`❌ Server error: ${error.message}`)
      }

      process.exit(1)
    })
  } catch (error) {
    logger.error('❌ Failed to start server', error)
    process.exit(1)
  }
}

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`⚠️ ${signal} received. Shutting down gracefully...`)

  if (server) {
    server.close(async () => {
      logger.info('🛑 HTTP server closed')

      try {
        await redisService.disconnect?.()
        logger.info('🔌 Redis disconnected')
      } catch (error) {
        logger.error('❌ Error disconnecting Redis', error)
      }

      process.exit(0)
    })

    // Force shutdown timeout
    setTimeout(() => {
      logger.error('❌ Graceful shutdown timeout. Force exiting...')
      process.exit(1)
    }, 10000)
  } else {
    process.exit(0)
  }
}

// Process Error Handlers
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM')
})

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT')
})

process.on('uncaughtException', error => {
  logger.error('❌ Uncaught Exception detected', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

process.on('unhandledRejection', error => {
  logger.error('❌ Unhandled Rejection detected', error)
  gracefulShutdown('UNHANDLED_REJECTION')
})

bootstrap()
