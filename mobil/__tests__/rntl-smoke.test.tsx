// Scaffold smoke test: proves @testing-library/react-native's render() actually
// works end-to-end (module resolution, the `test-renderer` peer dependency, and
// the async render() API introduced in RNTL v14). Not app-specific behavior -
// keep this minimal; real component tests belong in their own feature folders.
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'

test('React Native Testing Library render() calisiyor', async () => {
  const { getByText } = await render(<Text>Merhaba</Text>)
  expect(getByText('Merhaba')).toBeTruthy()
})
