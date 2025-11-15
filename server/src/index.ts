import cors from 'cors'
import crypto from 'crypto'
import dotenv from 'dotenv'
import express from 'express'
import { Pool } from 'pg'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const PORT = Number(process.env.PORT ?? 3000)
const BOT_TOKEN = process.env.BOT_TOKEN
const DATABASE_URL = process.env.DATABASE_URL

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN env variable is required')
}

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL env variable is required')
}

const pool = new Pool({ connectionString: DATABASE_URL })

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map((v) => v.trim()) ?? '*' }))
app.use(express.json())

const validateTelegramInitData = (initData: string) => {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) {
    return false
  }
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n')

  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest()
  const calculatedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')

  return calculatedHash === hash
}

app.post('/api/session', async (req, res) => {
  const { initData } = req.body ?? {}
  if (!initData || typeof initData !== 'string') {
    return res.status(400).json({ ok: false, error: 'initData is required' })
  }

  if (!validateTelegramInitData(initData)) {
    return res.status(401).json({ ok: false, error: 'invalid init data' })
  }

  const entries = Object.fromEntries(new URLSearchParams(initData)) as Record<string, string>
  const userRaw = entries.user
  if (!userRaw) {
    return res.status(400).json({ ok: false, error: 'initData has no user' })
  }

  const user = JSON.parse(userRaw)

  await pool.query(
    `INSERT INTO users (id, username, first_name, last_name, language_code, photo_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE
     SET username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         language_code = EXCLUDED.language_code,
         photo_url = EXCLUDED.photo_url,
         updated_at = now()`,
    [user.id, user.username, user.first_name, user.last_name, user.language_code, user.photo_url]
  )

  return res.json({ ok: true, user })
})

app.get('/api/catalog', async (_req, res) => {
  const result = await pool.query(
    `SELECT p.id, p.title, p.description, p.price_cents, p.product_type, s.title AS style
     FROM products p
     LEFT JOIN styles s ON p.style_id = s.id
     WHERE p.is_active = TRUE
     ORDER BY p.id`
  )

  return res.json({ ok: true, items: result.rows })
})

app.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params
  const result = await pool.query(
    `SELECT o.id, o.status, o.total_cents, o.comment, o.created_at, o.scheduled_at,
            json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price_cents', oi.price_cents, 'body_zone', oi.body_zone, 'notes', oi.notes))
            FILTER (WHERE oi.id IS NOT NULL) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  )

  return res.json({ ok: true, orders: result.rows })
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

