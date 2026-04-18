import type { AISelectors } from '@synap/types'
import { AI_SELECTORS } from '../../shared/constants.js'
import { BaseController } from './BaseController.js'

export class ChatGPTController extends BaseController {
  readonly aiProvider = 'chatgpt' as const

  getSelectors(): AISelectors {
    return AI_SELECTORS['chatgpt']!
  }
}
