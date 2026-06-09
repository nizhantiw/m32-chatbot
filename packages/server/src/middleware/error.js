export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message)

  const status = err.status || err.statusCode || 500
  const isProd = process.env.NODE_ENV === 'production'

  res.status(status).json({
    error: isProd && status === 500 ? 'Internal server error' : err.message,
  })
}
