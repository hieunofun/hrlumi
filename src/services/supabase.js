
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Thiếu cấu hình Supabase. Tạo file .env ở root với VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY (xem supabase/env.example), rồi restart npm run dev.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
