import crypto from 'crypto';
import {
  decryptFlowRequest,
  encryptFlowResponse,
  isFlowSignatureValid,
  FlowEndpointException,
} from '../src/flows.js';
import type { EncryptedFlowRequest } from '../src/flows.js';

// Generate a keypair once for the suite.
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** Mimic how WhatsApp encrypts a request to the Flow endpoint. */
function encryptRequest(
  pubPem: string,
  aesKey: Buffer,
  iv: Buffer,
  body: unknown
): EncryptedFlowRequest {
  const encrypted_aes_key = crypto
    .publicEncrypt(
      {
        key: pubPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey
    )
    .toString('base64');

  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(body), 'utf-8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return {
    encrypted_aes_key,
    encrypted_flow_data: encrypted.toString('base64'),
    initial_vector: iv.toString('base64'),
  };
}

describe('Flow endpoint helpers', () => {
  const aesKey = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const requestBody = { version: '3.0', action: 'INIT', flow_token: 'tok' };

  it('decrypts an incoming request', () => {
    const enc = encryptRequest(publicKey, aesKey, iv, requestBody);
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } =
      decryptFlowRequest(enc, privateKey);

    expect(decryptedBody).toEqual(requestBody);
    expect(aesKeyBuffer.equals(aesKey)).toBe(true);
    expect(initialVectorBuffer.equals(iv)).toBe(true);
  });

  it('encrypts a response that round-trips with the flipped IV', () => {
    const enc = encryptRequest(publicKey, aesKey, iv, requestBody);
    const { aesKeyBuffer, initialVectorBuffer } = decryptFlowRequest(
      enc,
      privateKey
    );

    const response = { screen: 'SUCCESS', data: { ok: true } };
    const encryptedResponse = encryptFlowResponse(
      response,
      aesKeyBuffer,
      initialVectorBuffer
    );

    // Decrypt manually using the flipped IV, as the WhatsApp client does.
    const flippedIv = Buffer.from(iv.map((b) => ~b));
    const buf = Buffer.from(encryptedResponse, 'base64');
    const ciphertext = buf.subarray(0, -16);
    const tag = buf.subarray(-16);
    const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, flippedIv);
    decipher.setAuthTag(tag);
    const out = JSON.parse(
      Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
        'utf-8'
      )
    );

    expect(out).toEqual(response);
  });

  it('throws FlowEndpointException(421) when the private key is wrong', () => {
    const enc = encryptRequest(publicKey, aesKey, iv, requestBody);
    const other = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    expect.assertions(2);
    try {
      decryptFlowRequest(enc, other.privateKey);
    } catch (e) {
      expect(e).toBeInstanceOf(FlowEndpointException);
      expect((e as FlowEndpointException).statusCode).toBe(421);
    }
  });

  it('validates the request signature', () => {
    const appSecret = 'app-secret';
    const raw = JSON.stringify({ a: 1 });
    const sig =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(raw).digest('hex');

    expect(isFlowSignatureValid(raw, sig, appSecret)).toBe(true);
    expect(isFlowSignatureValid(raw, sig, 'wrong-secret')).toBe(false);
    expect(isFlowSignatureValid(raw, undefined, appSecret)).toBe(false);
  });
});
