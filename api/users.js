import { supabase } from '../supabase.js'

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('users')
    .select('*')

  if (error) return res.status(400).json({ error })
  res.status(200).json(data)
}
