/**
 * Dispatcher Class
 * Routes incoming messages to appropriate handlers
 */

import type {
  WebhookPayload,
  WebhookValue,
  NextStepConfig,
  WhatsAppClient,
  StatusHandlerFunction,
  StatusHandlerOptions,
  MessageStatusType,
} from './types/index.js';
import { Update } from './Update.js';
import { StatusUpdate } from './StatusUpdate.js';
import type { UpdateHandler } from './Handlers.js';
import { MessageHandler } from './Handlers.js';
import { isOlderThanMinutes } from './utils/helpers.js';

/**
 * Dispatcher class - manages message routing and handler execution
 */
export class Dispatcher {
  private bot: WhatsAppClient;
  /**
   * Per-phone-number processing chains. Updates for the same number are
   * processed serially (chained); different numbers run concurrently.
   */
  private chains: Map<string, Promise<void>> = new Map();
  private inFlight = 0;
  private registeredHandlers: UpdateHandler[] = [];
  private statusHandlers: Array<{
    action: StatusHandlerFunction;
    statuses?: MessageStatusType[];
    ignoreAfterMinutes?: number;
  }> = [];
  private markAsRead: boolean;
  private showTyping: boolean;
  private nextStepHandlers: Map<string, NextStepConfig> = new Map();

  constructor(bot: WhatsAppClient, markAsRead: boolean = true, showTyping: boolean = false) {
    this.bot = bot;
    this.markAsRead = markAsRead;
    this.showTyping = showTyping;
  }

  /**
   * Process an incoming webhook update.
   *
   * Updates for the same phone number are processed serially (so conversation
   * state such as {@link setNextStep} and per-user context stays ordered),
   * while updates for different numbers are processed concurrently.
   *
   * The returned promise resolves (or rejects) with this update's own outcome;
   * a failure in one update never blocks subsequent updates for that number.
   */
  async processUpdate(update: WebhookPayload): Promise<void> {
    const key = this.serializationKey(update);
    const previous = this.chains.get(key) ?? Promise.resolve();

    const run = previous.then(() => this.processQueueItem(update));
    // The stored chain must never reject, or a thrown handler would break
    // serialization for every later update from the same number.
    const chained = run.catch(() => {});
    this.chains.set(key, chained);
    this.inFlight++;

    try {
      await run;
    } finally {
      this.inFlight--;
      // Drop the key once this is the tail of its chain, to avoid leaking a
      // map entry per phone number seen.
      if (this.chains.get(key) === chained) {
        this.chains.delete(key);
      }
    }
  }

  /**
   * Derive the serialization key for an update — the user's phone number, so
   * all events (messages and statuses) for one number share a chain.
   */
  private serializationKey(payload: WebhookPayload): string {
    const value = payload.entry?.[0]?.changes?.[0]?.value;
    return (
      value?.messages?.[0]?.from ??
      value?.statuses?.[0]?.recipient_id ??
      '__default__'
    );
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(
    webhookPayload: WebhookPayload
  ): Promise<void> {
    const value: WebhookValue | undefined =
      webhookPayload.entry?.[0]?.changes?.[0]?.value;

    if (!value?.metadata?.phone_number_id) {
      return;
    }

    if (String(value.metadata.phone_number_id) !== String(this.bot.id)) {
      return;
    }

    // Status webhooks carry delivery receipts (sent/delivered/read/failed),
    // not inbound messages — route them to the registered status handlers.
    if (value.statuses && value.statuses.length > 0) {
      await this.dispatchStatuses(value);
      return;
    }

    const message = value.messages?.[0];
    if (!message) {
      return;
    }

    // Mark message as read if enabled
    if (this.markAsRead) {
      await this.bot.markAsRead(message, this.showTyping).catch(() => {
        // Silently fail - marking as read is not critical
      });
    }

    const update = new Update(this.bot, value);

    // Get applicable handlers
    const handlers = this.getHandlersForUpdate(update);

    // Process handlers
    for (const handler of handlers) {
      const messageText = handler.extractData(message).messageText;

      const shouldRun = await this.checkAndRunHandler(
        handler,
        value,
        messageText
      );

      if (shouldRun) {
        // Remove next step handler if it was executed
        const nextStepConfig = this.nextStepHandlers.get(
          update.userPhoneNumber
        );
        if (
          nextStepConfig &&
          (nextStepConfig.handler === handler ||
            nextStepConfig.fallbackHandler === handler)
        ) {
          this.nextStepHandlers.delete(update.userPhoneNumber);
        }
        return; // Stop processing after first successful handler
      }
    }
  }

  /**
   * Get handlers for current update
   */
  private getHandlersForUpdate(update: Update): UpdateHandler[] {
    const persistentHandlers = this.registeredHandlers.filter(
      (h) => h.persistent
    );

    const nextStepConfig = this.nextStepHandlers.get(update.userPhoneNumber);

    if (nextStepConfig) {
      const handlers: UpdateHandler[] = [];
      if (nextStepConfig.fallbackHandler) {
        handlers.push(nextStepConfig.fallbackHandler);
      }
      handlers.push(nextStepConfig.handler);
      return [...persistentHandlers, ...handlers];
    }

    return [...persistentHandlers, ...this.registeredHandlers];
  }

  /**
   * Check if handler matches and run it
   */
  private async checkAndRunHandler(
    handler: UpdateHandler,
    value: WebhookValue,
    messageText: string
  ): Promise<boolean> {
    const message = value.messages?.[0];
    if (!message) return false;

    // Check if handler type matches message type
    if (handler.name !== message.type) {
      return false;
    }

    // Skip stale messages if the handler opted into an age limit
    if (
      handler.ignoreAfterMinutes !== undefined &&
      isOlderThanMinutes(message.timestamp, handler.ignoreAfterMinutes)
    ) {
      return false;
    }

    // Check filter
    if (!handler.filterCheck(messageText)) {
      return false;
    }

    // Create update with extracted data
    const update = new Update(this.bot, value);
    const extractedData = handler.extractData(message);

    update.messageText = extractedData.messageText;
    Object.assign(update, extractedData);

    // The in-memory user context has been removed; the deprecated `context`
    // parameter is no longer injected (handlers receive `undefined`). Manage
    // conversation state in your own store keyed by update.userPhoneNumber.
    await handler.run(update);

    return true;
  }

  /**
   * Dispatch each status in a `statuses` webhook to the registered status
   * handlers. Errors thrown by a handler are swallowed so that one failing
   * handler cannot block the others.
   */
  private async dispatchStatuses(value: WebhookValue): Promise<void> {
    if (this.statusHandlers.length === 0 || !value.statuses) {
      return;
    }

    for (const status of value.statuses) {
      const statusUpdate = new StatusUpdate(this.bot, value, status);

      for (const handler of this.statusHandlers) {
        if (handler.statuses && !handler.statuses.includes(status.status)) {
          continue;
        }
        if (
          handler.ignoreAfterMinutes !== undefined &&
          isOlderThanMinutes(status.timestamp, handler.ignoreAfterMinutes)
        ) {
          continue;
        }
        try {
          await handler.action(statusUpdate);
        } catch {
          // A failing status handler must not break others or stall the queue
        }
      }
    }
  }

  /**
   * Register a handler
   */
  registerHandler(handler: UpdateHandler): number {
    this.registeredHandlers.push(handler);
    return this.registeredHandlers.length - 1;
  }

  /**
   * Register a message-status handler
   */
  registerStatusHandler(
    action: StatusHandlerFunction,
    options: StatusHandlerOptions = {}
  ): void {
    const statuses = options.status
      ? Array.isArray(options.status)
        ? options.status
        : [options.status]
      : undefined;

    this.statusHandlers.push({
      action,
      statuses,
      ignoreAfterMinutes: options.ignoreAfterMinutes,
    });
  }

  /**
   * Set next step handler for a specific user
   */
  setNextStep(
    update: Update,
    handler: UpdateHandler,
    fallbackFunction?: () => void | Promise<void>,
    fallbackRegex: string | RegExp = /^(end|stop|cancel)$/i
  ): void {
    const config: NextStepConfig = {
      handler: handler,
    };

    if (fallbackFunction) {
      const regex =
        typeof fallbackRegex === 'string'
          ? new RegExp(fallbackRegex)
          : fallbackRegex;

      config.fallbackHandler = new MessageHandler(fallbackFunction as any, {
        regex,
      });
    }

    this.nextStepHandlers.set(update.userPhoneNumber, config);
  }

  /**
   * Clear next step handler for a user
   */
  clearNextStep(phoneNumber: string): void {
    this.nextStepHandlers.delete(phoneNumber);
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): UpdateHandler[] {
    return [...this.registeredHandlers];
  }

  /**
   * Clear all handlers
   */
  clearHandlers(): void {
    this.registeredHandlers = [];
  }

  /**
   * Get processing status.
   *
   * `size` is the number of updates currently being processed (in flight
   * across all phone-number chains); `isProcessing` is true while any update
   * is in flight.
   */
  getQueueStatus(): { size: number; isProcessing: boolean } {
    return {
      size: this.inFlight,
      isProcessing: this.inFlight > 0,
    };
  }
}
