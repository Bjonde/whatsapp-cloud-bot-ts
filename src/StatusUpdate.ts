/**
 * StatusUpdate Class
 * Represents an incoming delivery-status webhook for a previously-sent message
 */

import type {
  WebhookValue,
  WhatsAppClient,
  MessageStatus,
  MessageStatusType,
  MessageStatusError,
  MessageStatusConversation,
  MessageStatusPricing,
} from './types/index.js';

/**
 * StatusUpdate - encapsulates a single message-status entry from a `statuses`
 * webhook (e.g. `sent`, `delivered`, `read`, `failed`).
 *
 * @example
 * ```typescript
 * client.onMessageStatus(async (status) => {
 *   if (status.isFailed) {
 *     console.error(
 *       `Message ${status.messageId} to ${status.recipientId} failed:`,
 *       status.error?.code,
 *       status.error?.title
 *     );
 *   }
 * }, { status: 'failed' });
 * ```
 */
export class StatusUpdate {
  /** The client that received this status. */
  public bot: WhatsAppClient;
  /** The raw webhook value this status was extracted from. */
  public value: WebhookValue;
  /** The raw status object from the webhook. */
  public raw: MessageStatus;
  /** WhatsApp message id (wamid) this status refers to. */
  public messageId: string;
  /** Delivery status: `sent` | `delivered` | `read` | `failed`. */
  public status: MessageStatusType;
  /** Recipient's WhatsApp id (phone number). */
  public recipientId: string;
  /** When the status occurred. */
  public timestamp: Date;
  /** Failure details — populated only when `status === 'failed'`. */
  public errors: MessageStatusError[];
  /** Conversation/billing-window context, if present. */
  public conversation?: MessageStatusConversation;
  /** Pricing context, if present. */
  public pricing?: MessageStatusPricing;
  /**
   * Tracking string echoed back from `biz_opaque_callback_data`, if you set one
   * when sending. Useful for correlating this status to your own records.
   */
  public callbackData?: string;

  constructor(bot: WhatsAppClient, value: WebhookValue, status: MessageStatus) {
    this.bot = bot;
    this.value = value;
    this.raw = status;
    this.messageId = status.id;
    this.status = status.status;
    this.recipientId = status.recipient_id;
    this.timestamp = new Date(Number(status.timestamp) * 1000);
    this.errors = status.errors ?? [];
    this.conversation = status.conversation;
    this.pricing = status.pricing;
    this.callbackData = status.biz_opaque_callback_data;
  }

  /** True when the message was accepted by WhatsApp servers. */
  get isSent(): boolean {
    return this.status === 'sent';
  }

  /** True when the message was delivered to the recipient's device. */
  get isDelivered(): boolean {
    return this.status === 'delivered';
  }

  /** True when the recipient opened the message. */
  get isRead(): boolean {
    return this.status === 'read';
  }

  /** True when delivery failed — inspect {@link error} for the reason. */
  get isFailed(): boolean {
    return this.status === 'failed';
  }

  /** The first reported error, if any (convenience for failed statuses). */
  get error(): MessageStatusError | undefined {
    return this.errors[0];
  }
}
