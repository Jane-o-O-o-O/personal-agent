import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { Store } from '../src/server/store.ts';
import { SettingsStore } from '../src/server/settings.ts';
import { ModelConfigService } from '../src/server/model-config.ts';
import { cleanError } from '../src/server/errors.ts';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const resultDir = join(projectRoot, '.runtime', 'full-verification');
const reportPath = join(resultDir, 'model-vision.json');
const imagePath = join(resultDir, 'vision-challenge.png');
const report = {
  startedAt: new Date().toISOString(),
  purpose: 'Verify actual image recognition using the currently encrypted model credential without changing settings.',
  outcome: 'not_verified',
  visionSupported: false,
  settingsChanged: false,
  attempts: [],
};
let store;
let browser;
let apiKey = '';
let snapshot;

async function createChallenge() {
  const digits = String(randomInt(1000, 10000));
  const colors = [
    { name: 'red', hex: '#e62222', rgb: [230, 34, 34] },
    { name: 'green', hex: '#16b74e', rgb: [22, 183, 78] },
    { name: 'blue', hex: '#205ce6', rgb: [32, 92, 230] },
  ];
  for (let index = colors.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [colors[index], colors[other]] = [colors[other], colors[index]];
  }
  browser = await chromium.launch({ headless: true, channel: process.env.AGENT_VERIFY_BROWSER_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
  const page = await browser.newPage({ viewport: { width: 760, height: 480 }, deviceScaleFactor: 1 });
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff}canvas{display:block;width:760px;height:480px}</style></head><body><canvas width="760" height="480"></canvas></body></html>');
  const pixelCheck = await page.evaluate(async ({ digits, colors }) => {
    await document.fonts.ready;
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 760, 480);
    context.fillStyle = '#101010';
    context.font = 'bold 144px monospace';
    context.textAlign = 'center';
    context.fillText(digits, 380, 205);
    colors.forEach((color, index) => {
      context.fillStyle = color.hex;
      context.fillRect(70 + index * 240, 300, 140, 100);
    });
    const centers = colors.map((_color, index) => Array.from(context.getImageData(140 + index * 240, 350, 1, 1).data).slice(0, 3));
    const pixels = context.getImageData(100, 65, 560, 170).data;
    let darkPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] < 40 && pixels[index + 1] < 40 && pixels[index + 2] < 40) darkPixels++;
    }
    return { width: canvas.width, height: canvas.height, centers, darkPixels };
  }, { digits, colors });
  assert.ok(pixelCheck.darkPixels > 5000, 'Numeric challenge is blank');
  assert.deepEqual(pixelCheck.centers, colors.map(color => color.rgb), 'Color challenge is blank or wrong');
  const image = await page.locator('canvas').screenshot({ type: 'png' });
  await writeFile(imagePath, image, { mode: 0o600 });
  await browser.close();
  browser = undefined;
  return { digits, colors: colors.map(color => color.name), image, pixelCheck };
}

function inspectPayload(payload, digits) {
  const content = payload.messages.flatMap(message => Array.isArray(message.content) ? message.content : []);
  const imageBlocks = content.filter(block => block.type === 'image_url');
  const textBlocks = payload.messages.flatMap(message => typeof message.content === 'string'
    ? [message.content] : (message.content || []).filter(block => block.type === 'text').map(block => block.text));
  assert.equal(imageBlocks.length, 1, 'Provider payload omitted the image');
  assert.ok(imageBlocks[0].image_url.url.startsWith('data:image/png;base64,'), 'Provider payload must send PNG');
  assert.equal(textBlocks.some(value => value.includes(digits)), false, 'Text leaked the expected number');
  assert.equal(Boolean(payload.reasoning_effort), false, 'Reasoning was enabled');
  return { imageBlocks: imageBlocks.length, textContainsExpectedDigits: false, reasoningParameterPresent: Object.hasOwn(payload, 'reasoning_effort') };
}

try {
  if (existsSync(join(projectRoot, '.env'))) process.loadEnvFile(join(projectRoot, '.env'));
  const dataDir = resolve(projectRoot, process.env.DATA_DIR || 'data');
  assert.ok(existsSync(join(dataDir, 'agent.sqlite')), 'Existing settings database is required');
  const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || (await readFile(join(dataDir, 'master-key'), 'utf8')).trim(), 'base64url');
  assert.equal(encryptionKey.length, 32, 'Invalid settings encryption key');
  store = new Store(join(dataDir, 'agent.sqlite'));
  const settings = new SettingsStore(store, encryptionKey);
  snapshot = store.get('SELECT value FROM settings WHERE key=?', 'integration:model')?.value;
  const models = new ModelConfigService(settings, dataDir);
  const setup = await models.runtime();
  assert.equal(setup.config.baseUrl.replace(/\/$/, ''), 'https://api.jane-zz.online/v1', 'Only the user-authorized relay may receive the credential');
  assert.equal(setup.config.model, 'gpt-6-sol', 'Only the configured model may be tested');
  assert.equal(setup.config.api, 'openai-completions', 'Keep the configured API');
  assert.equal(setup.config.reasoning, false, 'Keep reasoning disabled');
  apiKey = setup.config.apiKey;
  assert.ok(apiKey, 'Stored model credential is required');
  report.model = { baseUrl: setup.config.baseUrl, id: setup.config.model, api: setup.config.api, configuredImages: setup.config.images, reasoning: setup.config.reasoning };
  await mkdir(resultDir, { recursive: true, mode: 0o700 });
  const challenge = await createChallenge();
  report.challenge = { imagePath, digits: challenge.digits, colors: challenge.colors, pixelCheck: challenge.pixelCheck };
  const model = { ...setup.model, input: ['text', 'image'], reasoning: false };
  const prompt = 'Read only the attached image. Return exactly one JSON object with keys "digits" (the four-digit number as a string) and "colors" (the three block colors from left to right, each one of "red", "green", "blue"). Do not include markdown, explanations, or guesses if the image is inaccessible.';
  const context = { messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image', data: challenge.image.toString('base64'), mimeType: 'image/png' }], timestamp: Date.now() }] };
  for (let attempt = 1; attempt <= 2; attempt++) {
    const entry = { attempt, startedAt: new Date().toISOString(), result: 'not_verified' };
    report.attempts.push(entry);
    const started = performance.now();
    try {
      const result = await setup.runtime.completeSimple(model, context, {
        apiKey, reasoning: 'off', maxTokens: 512, timeoutMs: 90000, maxRetries: 0,
        signal: AbortSignal.timeout(90000),
        onPayload(payload) { entry.payload = inspectPayload(payload, challenge.digits); },
        onResponse(response) { entry.httpStatus = response.status; },
      });
      entry.elapsedMs = Math.round(performance.now() - started);
      entry.stopReason = result.stopReason;
      if (result.stopReason === 'error' || result.stopReason === 'aborted') {
        entry.result = 'provider_error';
        entry.error = cleanError(result.errorMessage || 'Model request did not finish', [apiKey]);
      } else {
        const text = result.content.filter(block => block.type === 'text').map(block => block.text).join('');
        let parsed;
        try { parsed = JSON.parse(text); } catch { entry.result = 'invalid_json'; }
        if (parsed) {
          const valid = typeof parsed.digits === 'string' && /^\d{4}$/.test(parsed.digits)
            && Array.isArray(parsed.colors) && parsed.colors.length === 3 && parsed.colors.every(color => ['red', 'green', 'blue'].includes(color));
          if (!valid) entry.result = 'invalid_schema';
          else {
            entry.response = { digits: parsed.digits, colors: parsed.colors };
            entry.numberMatched = parsed.digits === challenge.digits;
            entry.colorsMatched = parsed.colors.every((color, index) => color === challenge.colors[index]);
            entry.result = entry.numberMatched && entry.colorsMatched ? 'recognition_pass' : 'recognition_mismatch';
          }
        }
      }
    } catch (error) {
      entry.elapsedMs = Math.round(performance.now() - started);
      entry.result = 'request_error';
      entry.error = cleanError(error, [apiKey]);
    }
    console.log(JSON.stringify({ attempt: entry.attempt, result: entry.result, elapsedMs: entry.elapsedMs, httpStatus: entry.httpStatus }));
    if (entry.result === 'recognition_pass') {
      report.outcome = 'recognition_pass';
      report.visionSupported = true;
      break;
    }
  }
  if (!report.visionSupported) report.outcome = 'vision_not_verified';
} catch (error) {
  report.outcome = 'verification_error';
  report.error = cleanError(error, apiKey ? [apiKey] : []);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (store) {
    report.settingsChanged = store.get('SELECT value FROM settings WHERE key=?', 'integration:model')?.value !== snapshot;
    store.close();
  }
  apiKey = '';
  report.finishedAt = new Date().toISOString();
  await mkdir(resultDir, { recursive: true, mode: 0o700 });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ report: reportPath, outcome: report.outcome, visionSupported: report.visionSupported, settingsChanged: report.settingsChanged }));
  if (!report.visionSupported || report.settingsChanged) process.exitCode = 1;
}
