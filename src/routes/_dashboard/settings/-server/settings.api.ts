import { createServerFn } from '@tanstack/react-start'
import { settingsMock } from './settings.mock'
import type { SettingsData } from '../settings.types'

export const getSettingsData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SettingsData> => {
    return settingsMock
  },
)