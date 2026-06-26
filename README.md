# WhatsApp Bot Client

A powerful, fully-typed TypeScript/JavaScript library for building WhatsApp bots using the [WhatsApp Business Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api).

Looking for Python? A Python version exists here: [python-whatsapp-bot](https://github.com/radi-dev/python-whatsapp-bot).

[![npm version](https://img.shields.io/npm/v/whatsapp-cloud-bot-ts.svg)](https://www.npmjs.com/package/whatsapp-cloud-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)

## Features

✨ **Fully Typed** - Complete TypeScript support with comprehensive type definitions
🚀 **Async/Await** - Modern async JavaScript architecture built from the ground up
📦 **Dual Package** - Works with both ESM and CommonJS
🎯 **Event-Driven** - Elegant handler-based message routing
💬 **Interactive Messages** - Support for buttons, lists, and location requests
📸 **Media Support** - Send and receive images, videos, audio, documents, and stickers
🔄 **Conversation Flow** - Next-step handlers (bring your own store for state)
🧪 **Well Tested** - Comprehensive test suite included
📚 **Great Documentation** - Detailed guides and API reference

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Getting WhatsApp Credentials](#getting-whatsapp-credentials)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [TypeScript Usage](#typescript-usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install whatsapp-cloud-bot

# or with yarn
yarn add whatsapp-cloud-bot

# or with pnpm
pnpm add whatsapp-cloud-bot
```

## Quick Start

You can initialize the client in two ways.

### Method 1: Initialize with Handlers (Recommended)

Pass your handlers directly to the constructor for a cleaner setup.

```typescript
import { WhatsApp, MessageHandler } from 'whatsapp-cloud-bot';

const messageHandler = new MessageHandler(async (update) => {
  await update.replyMessage('Hello!');
});

const client = new WhatsApp({
  numberId: 'YOUR_PHONE_NUMBER_ID',
  token: 'YOUR_ACCESS_TOKEN',
  handlers: {
    messageHandler,
  }
});
```

### Method 2: Register Handlers Separately

Initialize the client first, then register handlers.

```typescript
import { WhatsApp } from 'whatsapp-cloud-bot';

const client = new WhatsApp({
  numberId: 'YOUR_PHONE_NUMBER_ID',
  token: 'YOUR_ACCESS_TOKEN',
});

// Register a message handler
client.onMessage(async (update, context) => {
  console.log(`Message from ${update.userDisplayName}: ${update.messageText}`);
  await update.replyMessage('Hello! Thanks for your message.');
});
```

### Webhook Integration

```typescript
// Process incoming webhook (in your Express/HTTP server)
app.post('/webhook', async (req, res) => {
  await client.processUpdate(req.body);
  res.sendStatus(200);
});
```

## Getting WhatsApp Credentials

To use this library, you need to obtain a **Phone Number ID** and **Access Token** from the [Facebook Developer Portal](https://developers.facebook.com/).

### Step-by-Step Guide:

1. **Create a Meta/Facebook Developer Account**
   - Go to [developers.facebook.com](https://developers.facebook.com/)
   - Create an account or log in

2. **Create a New App**
   - Click "Create App"
   - Select "Business" as the app type
   - Fill in the required details

3. **Add WhatsApp Product**
   - In your app dashboard, click "Add Product"
   - Find "WhatsApp" and click "Set Up"

4. **Get Your Credentials**
   - **Phone Number ID**: Found in the WhatsApp > Getting Started section
   - **Temporary Token**: Also in the Getting Started section (valid for 24 hours)
   - **Permanent Token**: Follow [this guide](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#1--acquire-an-access-token-using-a-system-user-or-facebook-login) to create a permanent token

5. **Set Up Webhook** (for receiving messages)
   - In WhatsApp > Configuration
   - Add your webhook URL (must be HTTPS)
   - Subscribe to message events
   - Verify the webhook

### Testing Your Setup

WhatsApp provides a test phone number you can use immediately. For production, you'll need to:
- Add a real phone number
- Complete business verification
- Get your app approved

## Usage Examples

### Sending Different Types of Messages

#### Text Messages

```typescript
// Simple text message
await client.sendMessage('1234567890', 'Hello, World!');

// With web preview
await client.sendMessage('1234567890', 'Check this out: https://example.com', {
  webPagePreview: true
});
```

#### Interactive Messages with Buttons

```typescript
import { InlineKeyboard } from 'whatsapp-cloud-bot';

await client.sendMessage(
  '1234567890',
  'Choose an option:',
  {
    replyMarkup: new InlineKeyboard(['Option 1', 'Option 2', 'Option 3'])
  }
);
```

#### Interactive Lists

```typescript
import { InlineList, ListItem, ListSection } from 'whatsapp-cloud-bot';

// Simple list
const list = new InlineList('Select item', [
  new ListItem('Item 1', 'item_1'),
  new ListItem('Item 2', 'item_2')
]);

// List with sections
const sectionedList = new InlineList('Choose category', [
  new ListSection('Fruits', ['Apple', 'Banana', 'Orange']),
  new ListSection('Vegetables', ['Carrot', 'Broccoli', 'Spinach'])
]);

await client.sendMessage('1234567890', 'Here are your options:', {
  replyMarkup: sectionedList
});
```

#### Interactive Media Carousels

Carousels come in two flavours — **quick-reply buttons** or **CTA URL buttons**. All cards in a carousel must use the same button type and count (all cards must have the same number of buttons).

Use the `ButtonCarouselCard` and `UrlCarouselCard` types — your IDE will guide you through the required fields. Internal fields (`card_index`, `type`, `header.type`, `action.name`/`button.type`) are populated for you at send time, so you only set the header, body, and action.

```typescript
import type { ButtonCarouselCard, UrlCarouselCard } from 'whatsapp-cloud-bot';

// --- Quick-reply button carousel ---
const qrCards: ButtonCarouselCard[] = [
  {
    header: { image: { link: 'https://example.com/img1.jpg' } },
    body: { text: 'First Item — tap a button below' },
    action: {
      buttons: [{ quick_reply: { id: 'buy_1', title: 'Buy Now' } }],
    },
  },
  {
    header: { video: { link: 'https://example.com/vid1.mp4' } },
    body: { text: 'Second Item' },
    action: {
      buttons: [{ quick_reply: { id: 'buy_2', title: 'Add to Cart' } }],
    },
  },
];

await client.sendButtonCarousel('1234567890', 'Check out these items:', qrCards);

// --- CTA URL button carousel ---
const urlCards: UrlCarouselCard[] = [
  {
    header: { image: { link: 'https://example.com/img1.jpg' } },
    body: { text: 'Visit our store' },
    action: {
      parameters: { display_text: 'Shop Now', url: 'https://example.com/shop' },
    },
  },
  {
    header: { image: { link: 'https://example.com/img2.jpg' } },
    body: { text: 'Read our blog' },
    action: {
      parameters: { display_text: 'Read More', url: 'https://example.com/blog' },
    },
  },
];

await client.sendUrlCarousel('1234567890', 'Explore our content:', urlCards);
```

> `CarouselCard<QuickReplyAction>` / `CarouselCard<CtaUrlAction>` remain available and are equivalent to the `ButtonCarouselCard` / `UrlCarouselCard` aliases above.

You can also reply to an incoming message directly from a handler:

```typescript
client.onMessage(async (update) => {
  // Quick-reply carousel reply
  await update.replyWithButtonCarousel('Pick one:', qrCards);

  // CTA URL carousel reply
  await update.replyWithUrlCarousel('Explore:', urlCards);
});
```

#### Flow Messages

Send an interactive [WhatsApp Flow](https://developers.facebook.com/documentation/business-messaging/whatsapp/flows). Provide **either** `flow_id` **or** `flow_name` (mutually exclusive) plus a `flow_cta`; the library fills in the documented defaults (`flow_message_version: '3'`, `mode: 'published'`, `flow_token: 'unused'`, `flow_action: 'navigate'`) and serializes `flow_action_payload.data` to the JSON string the API expects.

```typescript
// Navigate to a specific screen with prefilled data
await client.sendFlowMessage('1234567890', 'Complete your signup', {
  flow_id: '1234567890',
  flow_cta: 'Sign up',
  flow_token: 'order_42',                 // your correlation id (default 'unused')
  flow_action: 'navigate',                // default
  flow_action_payload: {
    screen: 'WELCOME',                    // default FIRST_ENTRY_SCREEN
    data: { plan: 'pro' },                // serialized to a JSON string for you
  },
});

// data_exchange — first screen resolved by your endpoint (payload omitted)
await client.sendFlowMessage('1234567890', 'Book an appointment', {
  flow_name: 'booking',
  flow_cta: 'Book now',
  flow_action: 'data_exchange',
});

// Reply from a handler
client.onMessage((update) =>
  update.replyWithFlow('Tap to start', { flow_id: '123', flow_cta: 'Start' })
);
```

Building Flow markup directly (e.g. to pass via `sendMessage`) is also supported with `new InlineFlow({...})`.

#### Dedicated interactive senders

Besides `sendMessage({ replyMarkup })`, there are explicit senders: `sendTextMessage` (text only), `sendButtonMessage`, `sendListMessage`, and `sendFlowMessage` — each with `Update` equivalents `replyWithText`, `replyWithButton`, `replyWithList`, `replyWithFlow`.

> **Naming:** newer methods use the `replyWith*` style (e.g. `replyWithMedia`, `replyWithImage`). The older names (`replyMedia`, `replyImage`, `replyMessage`, …) still work but are **deprecated** — prefer the `replyWith*` versions.

#### Media Messages

```typescript
// Send image
await client.sendImage('1234567890', 'https://example.com/image.jpg', 'Check this out!');

// Send video
await client.sendVideo('1234567890', 'https://example.com/video.mp4');

// Send document
await client.sendDocument('1234567890', 'https://example.com/doc.pdf', 'Here is the file');

// Send audio
await client.sendAudio('1234567890', 'https://example.com/audio.mp3');
```

#### Location Messages

```typescript
await client.sendLocation(
  '1234567890',
  37.7749,  // latitude
  -122.4194, // longitude
  'San Francisco',
  '123 Market St, San Francisco, CA'
);
```

#### Template Messages

```typescript
await client.sendTemplateMessage(
  '1234567890',
  'hello_world', // template name
  [],            // components
  'en_US'        // language code
);
```

### Handling Incoming Messages

#### Basic Message Handler

```typescript
client.onMessage(async (update, context) => {
  console.log(`Received: ${update.messageText}`);
  await update.replyMessage('Got your message!');
});
```

#### With Regex Filter

```typescript
// Only respond to messages matching regex
client.onMessage(
  async (update, context) => {
    await update.replyMessage('You said hello!');
  },
  { regex: /^(hi|hello|hey)/i }
);
```

#### With Custom Filter

```typescript
client.onMessage(
  async (update, context) => {
    await update.replyMessage('Processing your order...');
  },
  {
    filter: (text) => text.toLowerCase().includes('order')
  }
);
```

#### Interactive Message Handler

```typescript
client.onInteractiveMessage(async (update, context) => {
  if (update.messageText === 'option_1') {
    await update.replyMessage('You selected Option 1');
  }
});
```

#### Media Handlers

```typescript
// Handle images
client.onImageMessage(async (update, context) => {
  console.log(`Image caption: ${update.messageText}`);
  console.log(`Image ID: ${update.mediaFileId}`);

  // Download the image
  const filePath = await client.downloadMedia(update.mediaFileId);
  console.log(`Image saved to: ${filePath}`);
});

// Handle videos
client.onVideoMessage(async (update, context) => {
  await update.replyMessage('Thanks for the video!');
});

// Handle audio
client.onAudioMessage(async (update, context) => {
  if (update.mediaVoice) {
    await update.replyMessage('Got your voice message!');
  }
});

// Handle documents
client.onDocumentMessage(async (update, context) => {
  const buffer = await client.downloadMediaData(update.mediaFileId);
  // Process document...
});
```

#### Location Handler

```typescript
client.onLocationMessage(async (update, context) => {
  const { locLatitude, locLongitude, locName } = update;
  await update.replyMessage(
    `Got your location: ${locName || 'Unknown'} (${locLatitude}, ${locLongitude})`
  );
});
```

#### Message Status Handler

WhatsApp sends `statuses` webhooks reporting what happened to messages **you sent** (`sent`, `delivered`, `read`, `failed`). Register a handler with `onMessageStatus`. The status's `messageId` (wamid) is the only field linking it back to the original message.

```typescript
// React to every status change
client.onMessageStatus((status) => {
  console.log(`${status.messageId} → ${status.status}`);
});

// Or only to failures
client.onMessageStatus((status) => {
  console.error(
    `Delivery to ${status.recipientId} failed:`,
    status.error?.code,
    status.error?.title
  );
  // status.callbackData holds your biz_opaque_callback_data, if you set one
}, { status: 'failed' });
```

A `StatusUpdate` exposes `messageId`, `status`, `recipientId`, `timestamp` (a `Date`), `errors`/`error`, `conversation`, `pricing`, `callbackData`, and the booleans `isSent` / `isDelivered` / `isRead` / `isFailed`.

> **Correlating a status to your message:** the library is stateless — it does not retain sent-message ids. To act on a status (especially `failed`), record the wamid returned in the send response (`response.data.messages[0].id`) against your own domain data, or tag outgoing messages with `biz_opaque_callback_data` so it is echoed back on the status. See _Best Practices_ for handling failures.

**Tagging messages for correlation (`bizOpaqueCallbackData`).** Every send method accepts an optional tracking string that WhatsApp echoes back on the status webhook as `status.callbackData`. Stamp your own record id onto the message and you can route the status without a wamid lookup table:

```typescript
// On send — pass your own id (options object on sendMessage/sendMediaMessage,
// last positional arg on the others)
await client.sendMessage(user, 'Your order shipped!', {
  bizOpaqueCallbackData: 'order_12345',
});
await client.sendTemplateMessage(user, 'shipping', [], 'en_US', 'order_12345');

// On status — it comes straight back
client.onMessageStatus((status) => {
  if (status.isFailed) {
    markOrderNotificationFailed(status.callbackData); // "order_12345"
  }
}, { status: 'failed' });
```

**Ignoring stale events.** Every handler (message *and* status) accepts `ignoreAfterMinutes` — if more than that many minutes have elapsed since the webhook's `timestamp` (WEBHOOK_TRIGGER_TIMESTAMP), the handler is skipped. Useful for dropping events replayed or delivered long after the fact:

```typescript
// Ignore messages older than 5 minutes (e.g. webhook retries / backlog)
client.onMessage(handler, { ignoreAfterMinutes: 5 });

// Only act on fresh failures
client.onMessageStatus(handler, { status: 'failed', ignoreAfterMinutes: 10 });
```

### Conversation Flow Management

#### Tracking conversation state (bring your own store)

> **Deprecated:** the built-in in-memory `context` parameter has been **removed**. It grew unbounded and didn't work across multiple processes/instances. The `context` argument is still accepted in handler signatures (for source compatibility) but is always `undefined`. Manage state in your own store, keyed by `update.userPhoneNumber`.

```typescript
// e.g. a Redis/Postgres/Map you own and can evict/expire
const store = new Map<string, { name?: string; age?: number }>();

client.onMessage(async (update) => {
  const state = store.get(update.userPhoneNumber) ?? {};

  if (!state.name) {
    state.name = update.messageText;
    await update.replyMessage('Nice to meet you! How old are you?');
  } else if (!state.age) {
    state.age = parseInt(update.messageText);
    await update.replyMessage(`Hello ${state.name}, you are ${state.age}!`);
    store.delete(update.userPhoneNumber); // reset conversation
    return;
  }
  store.set(update.userPhoneNumber, state);
});
```

#### Using Next Step Handler

```typescript
import { MessageHandler } from 'whatsapp-cloud-bot';

client.onMessage(async (update, context) => {
  if (update.messageText === 'start survey') {
    await update.replyMessage('What is your name?');

    // Set next handler for this user only
    client.setNextStep(
      update,
      new MessageHandler(async (nextUpdate, nextContext) => {
        const name = nextUpdate.messageText;
        await nextUpdate.replyMessage(`Hello ${name}! Survey complete.`);
      })
    );
  }
});
```

## API Reference

### WhatsApp Client

#### Constructor

```typescript
const client = new WhatsApp(config: WhatsAppConfig);
```

**Configuration Options:**
- `numberId` (required): Your WhatsApp Phone Number ID
- `token` (required): Your WhatsApp Access Token
- `markAsRead` (optional, default: `true`): Auto-mark messages as read
- `version` (optional, default: `21`): WhatsApp API version

#### Methods

**Sending Messages:**
- `sendMessage(phoneNumber, text, options?)` - Send text message
- `sendTemplateMessage(phoneNumber, templateName, components?, languageCode?)` - Send template
- `sendImage(phoneNumber, imagePath, caption?)` - Send image
- `sendVideo(phoneNumber, videoPath, caption?)` - Send video
- `sendAudio(phoneNumber, audioPath)` - Send audio
- `sendDocument(phoneNumber, docPath, caption?)` - Send document
- `sendLocation(phoneNumber, latitude, longitude, name?, address?)` - Send location

**Media Management:**
- `getMediaUrl(mediaId)` - Get media URL from media ID
- `downloadMedia(mediaId, filePath?)` - Download media to file
- `downloadMediaData(mediaId)` - Download media as Buffer

**Handler Registration:**
- `onMessage(action, options?)` - Register text message handler
- `onInteractiveMessage(action, options?)` - Register interactive handler
- `onImageMessage(action, options?)` - Register image handler
- `onAudioMessage(action, options?)` - Register audio handler
- `onVideoMessage(action, options?)` - Register video handler
- `onDocumentMessage(action, options?)` - Register document handler
- `onStickerMessage(action, options?)` - Register sticker handler
- `onLocationMessage(action, options?)` - Register location handler

**Flow Control:**
- `setNextStep(update, handler, fallback?, fallbackRegex?)` - Set next step handler
- `clearNextStep(phoneNumber)` - Clear next step handler

**Webhook Processing:**
- `processUpdate(webhookPayload)` - Process incoming webhook

### Update Object

Available in all handler functions as the first parameter:

```typescript
interface Update {
  bot: WhatsApp;
  userDisplayName: string;
  userPhoneNumber: string;
  messageId: string;
  messageText?: string;
  message: WhatsAppMessage;

  // Media properties (when applicable)
  mediaMimeType?: string;
  mediaFileId?: string;
  mediaHash?: string;
  mediaVoice?: boolean;

  // Location properties (when applicable)
  locLatitude?: number;
  locLongitude?: number;
  locName?: string;
  locAddress?: string;

  // Methods
  replyMessage(text, options?): Promise<AxiosResponse>;
  replyMedia(mediaPath, options?): Promise<AxiosResponse>;
  replyTemplate(templateName, components?, languageCode?): Promise<AxiosResponse>;
}
```

### UserContext (removed)

> **Removed.** The in-memory `UserContext` class and the `clearAllContexts` / `getAllContextUsers` helpers no longer exist. The `context` second parameter of handlers is always `undefined`. Only the `UserContext` **type** is still exported, so the deprecated `context?: UserContext` parameter keeps compiling. Track conversation state in your own store keyed by `update.userPhoneNumber` (see _Tracking conversation state_ above).

## TypeScript Usage

The library is written in TypeScript and provides full type definitions:

```typescript
import {
  WhatsApp,
  Update,
  InlineKeyboard,
  HandlerFunction,
} from 'whatsapp-cloud-bot';

// Type-safe handler (the second `context` arg is deprecated and always undefined)
const myHandler: HandlerFunction = async (update: Update) => {
  // Full autocomplete and type checking
  const text: string | undefined = update.messageText;
  await update.replyWithText('Hello!');
};

client.onMessage(myHandler);
```

## Setting Up a Webhook Server

### Express.js Example

```typescript
import express from 'express';
import { WhatsApp } from 'whatsapp-cloud-bot';

const app = express();
const client = new WhatsApp({
  numberId: process.env.WA_PHONE_NUMBER_ID!,
  token: process.env.WA_TOKEN!,
});

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook handler (POST)
app.post('/webhook', express.json(), async (req, res) => {
  try {
    await client.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Register handlers
client.onMessage(async (update) => {
  await update.replyMessage('Hello from Express!');
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

## Implementing a Flow Endpoint

For Flows that use `flow_action: 'data_exchange'`, WhatsApp calls **your** endpoint with an encrypted payload. The library provides helpers for the [endpoint protocol](https://developers.facebook.com/documentation/business-messaging/whatsapp/flows/guides/implementingyourflowendpoint): RSA + AES-GCM decryption, response encryption (with the flipped IV), and `x-hub-signature-256` validation.

```typescript
import express from 'express';
import {
  decryptFlowRequest,
  encryptFlowResponse,
  isFlowSignatureValid,
  FlowEndpointException,
} from 'whatsapp-cloud-bot';

const app = express();
// Capture the raw body for signature validation
app.use(express.json({ verify: (req: any, _res, buf) => (req.rawBody = buf) }));

app.post('/flow', (req: any, res) => {
  if (!isFlowSignatureValid(req.rawBody, req.get('x-hub-signature-256'), process.env.APP_SECRET!)) {
    return res.sendStatus(432); // signature mismatch
  }

  try {
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } =
      decryptFlowRequest(req.body, process.env.FLOW_PRIVATE_KEY!);

    // Health check
    if (decryptedBody.action === 'ping') {
      return res.send(
        encryptFlowResponse({ data: { status: 'active' } }, aesKeyBuffer, initialVectorBuffer)
      );
    }

    // ...your screen/data-exchange logic, building `responseObject`...
    const responseObject = { screen: 'SUCCESS', data: {} };

    res.send(encryptFlowResponse(responseObject, aesKeyBuffer, initialVectorBuffer));
  } catch (err) {
    if (err instanceof FlowEndpointException) return res.sendStatus(err.statusCode);
    console.error(err);
    res.sendStatus(500);
  }
});
```

The encrypted response must be returned as the **raw** HTTP 200 body (a base64 string), not wrapped in JSON.

## Best Practices

1. **Use Environment Variables** for sensitive data:
   ```typescript
   const client = new WhatsApp({
     numberId: process.env.WA_PHONE_NUMBER_ID!,
     token: process.env.WA_TOKEN!,
   });
   ```

2. **Handle Errors Gracefully**:
   ```typescript
   client.onMessage(async (update) => {
     try {
       await update.replyMessage('Hello!');
     } catch (error) {
       console.error('Failed to send message:', error);
     }
   });
   ```

3. **Track Conversation State in Your Own Store** (the built-in in-memory context is deprecated/removed):
   ```typescript
   const started = new Set<string>(); // or Redis/Postgres in production
   client.onMessage(async (update) => {
     if (!started.has(update.userPhoneNumber)) {
       started.add(update.userPhoneNumber);
       await update.replyMessage('Welcome! What is your name?');
     }
   });
   ```

4. **Format Phone Numbers Consistently**:
   ```typescript
   // Library handles formatting, but ensure you include country code
   await client.sendMessage('1234567890', 'Hello'); // Good
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Radi](https://github.com/Radi-dev)

## Links

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [GitHub Repository](https://github.com/Radi-dev/whatsapp-cloud-bot-ts)
- [NPM Package](https://www.npmjs.com/package/whatsapp-cloud-bot-ts)
- [Issue Tracker](https://github.com/Radi-dev/whatsapp-cloud-bot-ts/issues)
- [Python version (python-whatsapp-bot)](https://github.com/radi-dev/python-whatsapp-bot)

## Support

If you find this library useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📖 Improving documentation
- 🤝 Contributing code

---

Made with ❤️ by the community
