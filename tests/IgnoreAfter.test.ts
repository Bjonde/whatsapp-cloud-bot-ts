import { jest } from '@jest/globals';
import { WhatsApp } from '../src/WhatsApp.js';
import type { WebhookPayload } from '../src/types/index.js';

const PHONE_NUMBER_ID = '106540352242922';

const nowSeconds = () => Math.floor(Date.now() / 1000);
const minutesAgo = (m: number) => String(nowSeconds() - m * 60);

function messagePayload(timestamp: string): WebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550783881',
                phone_number_id: PHONE_NUMBER_ID,
              },
              contacts: [{ profile: { name: 'Test' }, wa_id: '16505551234' }],
              messages: [
                {
                  from: '16505551234',
                  id: 'wamid.test',
                  timestamp,
                  type: 'text',
                  text: { body: 'hello' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function statusPayload(timestamp: string): WebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550783881',
                phone_number_id: PHONE_NUMBER_ID,
              },
              statuses: [
                {
                  id: 'wamid.test',
                  status: 'failed',
                  timestamp,
                  recipient_id: '16505551234',
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function makeClient(): WhatsApp {
  return new WhatsApp({
    numberId: PHONE_NUMBER_ID,
    token: 'test-token',
    markAsRead: false,
  });
}

describe('ignoreAfterMinutes', () => {
  it('drops a stale message but runs a recent one', async () => {
    const client = makeClient();
    const handler = jest.fn();
    client.onMessage(handler, { ignoreAfterMinutes: 5 });

    await client.processUpdate(messagePayload(minutesAgo(10)));
    expect(handler).not.toHaveBeenCalled();

    await client.processUpdate(messagePayload(minutesAgo(1)));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('drops a stale status but runs a recent one', async () => {
    const client = makeClient();
    const handler = jest.fn();
    client.onMessageStatus(handler, { ignoreAfterMinutes: 5 });

    await client.processUpdate(statusPayload(minutesAgo(10)));
    expect(handler).not.toHaveBeenCalled();

    await client.processUpdate(statusPayload(minutesAgo(1)));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('runs regardless of age when ignoreAfterMinutes is omitted', async () => {
    const client = makeClient();
    const handler = jest.fn();
    client.onMessageStatus(handler);

    await client.processUpdate(statusPayload(minutesAgo(1000)));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
