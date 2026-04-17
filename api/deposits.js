import { supabase } from '../supabase.js'

export default async function handler(req, res) {
  try {
    const userId = req.query.userId

    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      return res.status(400).json({ error })
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
