/**
 * WhatsApp Bot Client Library
 * A TypeScript/JavaScript library for building WhatsApp bots using WhatsApp Business Cloud API
 *
 * @packageDocumentation
 */

// Main Client
export { WhatsApp } from './WhatsApp.js';
export type { WhatsAppConfig } from './WhatsApp.js';

// Core Classes
export { Update } from './Update.js';
export {
  UserContext,
  clearAllContexts,
  getAllContextUsers,
} from './UserContext.js';
export { Dispatcher } from './Dispatcher.js';

// Handlers
export {
  UpdateHandler,
  MessageHandler,
  InteractiveQueryHandler,
  ImageHandler,
  AudioHandler,
  VideoHandler,
  DocumentHandler,
  StickerHandler,
  LocationHandler,
  UnknownHandler,
  UnsupportedHandler,
} from './Handlers.js';

// Markup Components
export {
  BaseReplyMarkup,
  InlineButton,
  InlineKeyboard,
  ListItem,
  ListSection,
  InlineList,
  InlineLocationRequest,
} from './Markup.js';

// Types
export * from './types/index.js';

// Utilities
export * from './utils/helpers.js';

// Default export
export { WhatsApp as default } from './WhatsApp.js';
