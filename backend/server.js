import express from 'express'
import cors from 'cors'
import { supabase } from './supabase.js'

const app = express()
app.use(cors())
app.use(express.json())

// Получить всех пользователей
app.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')

  if (error) return res.status(400).json({ error })
  res.json(data)
})

// Баланс пользователя
app.get('/balance/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('balances')
    .select('*')
    .eq('user_id', req.params.userId)
    .single()

  if (error) return res.status(400).json({ error })
  res.json(data)
})

// Ставки пользователя
app.get('/bets/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', req.params.userId)

  if (error) return res.status(400).json({ error })
  res.json(data)
})

// Пополнения пользователя
app.get('/deposits/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', req.params.userId)

  if (error) return res.status(400).json({ error })
  res.json(data)
})

app.listen(3000, () => {
  console.log('Backend запущен на http://localhost:3000')
})
