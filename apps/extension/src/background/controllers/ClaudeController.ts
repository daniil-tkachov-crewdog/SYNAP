import type { AISelectors } from '@synap/types'
import { AI_SELECTORS } from '../../shared/constants.js'
import { BaseController } from './BaseController.js'

export class ClaudeController extends BaseController {
  readonly aiProvider = 'claude' as const

  getSelectors(): AISelectors {
    return AI_SELECTORS['claude']!
  }
}
