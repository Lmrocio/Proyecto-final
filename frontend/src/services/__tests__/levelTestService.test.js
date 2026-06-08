import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '../apiClient'
import { submitLevelTest } from '../levelTestService'

vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

describe('submitLevelTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envia el tema y la composicion y devuelve los datos de la respuesta', async () => {
    const payload = { topic: 'Travel', composition: 'I love travelling around the world.' }
    const responseData = { level: 'B2', feedback: 'Great work!' }

    apiClient.post.mockResolvedValue({ data: responseData })

    const result = await submitLevelTest(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/level-tests', payload)
    expect(result).toEqual(responseData)
  })

  it('propaga el error cuando la peticion falla', async () => {
    const error = new Error('Network Error')
    error.response = { status: 422 }
    apiClient.post.mockRejectedValue(error)

    await expect(
      submitLevelTest({ topic: 'X', composition: 'short' }),
    ).rejects.toThrow('Network Error')
  })
})
