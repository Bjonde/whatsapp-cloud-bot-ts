import { jest } from '@jest/globals';
import { WhatsApp } from '../src/WhatsApp.js';
import { StatusUpdate } from '../src/StatusUpdate.js';
import type { WebhookPayload } from '../src/types/index.js';

const PHONE_NUMBER_ID = '106540352242922';

function failedStatusPayload(): WebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '102290129340398',
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
                  id: 'wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBI0QUQ2MjA4NEYyRkExNjMyREUA',
                  status: 'failed',
                  timestamp: '1751142888',
                  recipient_id: '16505551234',
                  errors: [
                    {
                      code: 131049,
                      title:
                        'This message was not delivered to maintain healthy ecosystem engagement.',
                      message:
                        'This message was not delivered to maintain healthy ecosystem engagement.',
                      error_data: {
                        details:
                          'In order to maintain a healthy ecosystem engagement, the message failed to be delivered.',
                      },
                      href: '/documentation/business-messaging/whatsapp/support/error-codes',
                    },
                  ],
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

describe('Message Status Handling', () => {
  it('invokes the status handler with a parsed StatusUpdate', async () => {
    const client = makeClient();
    const received: StatusUpdate[] = [];

    client.onMessageStatus((status) => {
      received.push(status);
    });

    await client.processUpdate(failedStatusPayload());

    expect(received).toHaveLength(1);
    const status = received[0];
    expect(status).toBeInstanceOf(StatusUpdate);
    expect(status.messageId).toBe(
      'wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBI0QUQ2MjA4NEYyRkExNjMyREUA'
    );
    expect(status.status).toBe('failed');
    expect(status.isFailed).toBe(true);
    expect(status.recipientId).toBe('16505551234');
    expect(status.error?.code).toBe(131049);
    expect(status.timestamp).toBeInstanceOf(Date);
  });

  it('respects the status filter option', async () => {
    const client = makeClient();
    const onFailed = jest.fn();
    const onDelivered = jest.fn();

    client.onMessageStatus(onFailed, { status: 'failed' });
    client.onMessageStatus(onDelivered, { status: 'delivered' });

    await client.processUpdate(failedStatusPayload());

    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onDelivered).not.toHaveBeenCalled();
  });

  it('ignores status webhooks for a different phone number id', async () => {
    const client = makeClient();
    const handler = jest.fn();
    client.onMessageStatus(handler);

    const payload = failedStatusPayload();
    payload.entry[0].changes[0].value.metadata.phone_number_id = '999';

    await client.processUpdate(payload);

    expect(handler).not.toHaveBeenCalled();
  });

  it('isolates a throwing handler from the others', async () => {
    const client = makeClient();
    const good = jest.fn();

    client.onMessageStatus(() => {
      throw new Error('boom');
    });
    client.onMessageStatus(good);

    await expect(
      client.processUpdate(failedStatusPayload())
    ).resolves.toBeUndefined();
    expect(good).toHaveBeenCalledTimes(1);
  });
});
