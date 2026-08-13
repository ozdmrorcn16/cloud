import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AnaEkran from '../../src/app/index'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn().mockResolvedValue({ error: null }) } },
}))

describe('AnaEkran', () => {
  it('cikis yap butonuna basinca signOut cagirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Cikis yap'))
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })
})
