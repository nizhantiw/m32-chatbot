const required = (name) => {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

const optional = (name, defaultVal = '') =>
  process.env[name] || defaultVal

export const env = {
  PORT: parseInt(optional('PORT', '3001')),
  NODE_ENV: optional('NODE_ENV', 'development'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),

  GOOGLE_AI_API_KEY: required('GOOGLE_GENERATIVE_AI_API_KEY'),
  GEMINI_MODEL: optional('GEMINI_MODEL', 'gemini-2.0-flash'),

  TAVILY_API_KEY: optional('TAVILY_API_KEY'),

  LANGFUSE_PUBLIC_KEY: optional('LANGFUSE_PUBLIC_KEY'),
  LANGFUSE_SECRET_KEY: optional('LANGFUSE_SECRET_KEY'),
  LANGFUSE_HOST: optional('LANGFUSE_HOST', 'https://cloud.langfuse.com'),

  GOOGLE_CLIENT_ID: optional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL: optional(
    'GOOGLE_CALLBACK_URL',
    'http://localhost:3001/api/auth/google/callback'
  ),

  CLIENT_URL: optional('CLIENT_URL', 'http://localhost:5173'),
  DB_PATH: optional('DB_PATH', './bizpilot.db'),
}
