import { apiClient } from './apiClient'

export const submitLevelTest = async ({ topic, composition }) => {
  const { data } = await apiClient.post('/level-tests', {
    topic,
    composition,
  })

  return data
}
