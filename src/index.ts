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
export { StatusUpdate } from './StatusUpdate.js';
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
  ButtonHandler,
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
  InlineFlow,
  buildFlowAction,
} from './Markup.js';

// Standalone message senders (low-level; take url + token)
export {
  sendButtonMessage,
  sendListMessage,
  sendFlowMessage,
} from './Message.js';
export type { InteractiveSendOptions } from './Message.js';

// Flow endpoint helpers (decrypt/encrypt/signature)
export {
  decryptFlowRequest,
  encryptFlowResponse,
  isFlowSignatureValid,
  FlowEndpointException,
} from './flows.js';
export type {
  EncryptedFlowRequest,
  FlowDataExchangeBody,
  DecryptedFlowRequest,
} from './flows.js';

// Types
export * from './types/index.js';

// Utilities
export * from './utils/helpers.js';
export * from './utils/uploadHelper.js';

// Default export
export { WhatsApp as default } from './WhatsApp.js';
