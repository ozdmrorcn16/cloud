import { supabase } from './supabase'

test('supabase istemcisi olusturulmus', () => {
  expect(supabase).toBeDefined()
  expect(typeof supabase.auth.signUp).toBe('function')
})
