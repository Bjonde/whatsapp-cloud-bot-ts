/**
 * Update Class
 * Represents an incoming message update from WhatsApp
 */

import type { AxiosResponse } from 'axios';
import type {
  WebhookValue,
  WhatsAppMessage,
  SendMessageOptions,
  SendMediaOptions,
  WhatsAppClient,
} from './types/index.js';

/**
 * Update class - encapsulates an incoming WhatsApp message
 */
export class Update {
  public bot: WhatsAppClient;
  public value: WebhookValue;
  public message: WhatsAppMessage;
  public user: {
    profile: { name: string };
    wa_id: string;
  };
  public userDisplayName: string;
  public userPhoneNumber: string;
  public messageId: string;
  public messageText?: string;
  public interactiveText?: any;
  public mediaUrl?: string;
  public mediaMimeType?: string;
  public mediaFileId?: string;
  public mediaHash?: string;
  public mediaVoice?: boolean;
  public locAddress?: string;
  public locName?: string;
  public locLatitude?: number;
  public locLongitude?: number;

  constructor(bot: WhatsAppClient, value: WebhookValue) {
    this.bot = bot;
    this.value = value;
    this.message = value.messages?.[0] || ({} as WhatsAppMessage);
    this.user = value.contacts?.[0] || { profile: { name: '' }, wa_id: '' };
    this.userDisplayName = this.user.profile?.name || '';
    this.userPhoneNumber = this.user.wa_id || '';
    this.messageId = this.message.id || '';
  }

  /**
   * Reply to the current message
   */
  async replyMessage(
    text: string,
    options: SendMessageOptions = {}
  ): Promise<AxiosResponse> {
    return await this.bot.sendMessage(this.userPhoneNumber, text, {
      ...options,
      msgId: options.msgId || this.messageId,
    });
  }

  /**
   * Reply with media
   */
  async replyMedia(
    mediaPath: string,
    options: SendMediaOptions = {}
  ): Promise<AxiosResponse> {
    return await this.bot.sendMediaMessage(this.userPhoneNumber, mediaPath, {
      ...options,
      msgId: options.msgId || this.messageId,
    });
  }

  /**
   * Reply with template message
   */
  async replyTemplate(
    templateName: string,
    components?: any[],
    languageCode?: string
  ): Promise<AxiosResponse> {
    return await this.bot.sendTemplateMessage(
      this.userPhoneNumber,
      templateName,
      components,
      languageCode
    );
  }

  /**
   * Reply with image message
   */
  async replyImage(
    imagePath: string,
    caption?: string
  ): Promise<AxiosResponse> {
    return await this.bot.sendImage(this.userPhoneNumber, imagePath, caption);
  }

  /**
   * Reply with video message
   */
  async replyVideo(
    videoPath: string,
    caption?: string
  ): Promise<AxiosResponse> {
    return await this.bot.sendVideo(this.userPhoneNumber, videoPath, caption);
  }

  /**
   * Reply with audio message
   */
  async replyAudio(audioPath: string): Promise<AxiosResponse> {
    return await this.bot.sendAudio(this.userPhoneNumber, audioPath);
  }

  /**
   * Reply with document message
   */
  async replyDocument(
    documentPath: string,
    caption?: string
  ): Promise<AxiosResponse> {
    return await this.bot.sendDocument(
      this.userPhoneNumber,
      documentPath,
      caption
    );
  }

  /**
   * Reply with location message
   */
  async replyLocation(
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<AxiosResponse> {
    return await this.bot.sendLocation(
      this.userPhoneNumber,
      latitude,
      longitude,
      name,
      address
    );
  }

  /**
   * Reply with sticker message
   */
  async replySticker(stickerPath: string): Promise<AxiosResponse> {
    return await this.bot.sendMediaMessage(this.userPhoneNumber, stickerPath, {
      mediaType: 'sticker',
    });
  }
}
