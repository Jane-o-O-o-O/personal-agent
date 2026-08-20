/**
 * 测试 sendMedia 路径：语音、视频、文件
 * 用法：npx tsx scripts/test-sendmedia.ts <openid>
 */
import { sendMedia } from "../src/outbound.js";
import type { ResolvedQQBotAccount } from "../src/types.js";
import * as fs from "node:fs";
import * as path from "node:path";

const LOG_FILE = "/tmp/test-sendmedia-output.log";

function log(msg: string) {
  const line = msg + "\n";
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

function normalizeAppId(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

function detectConfigPath(): string | null {
  const home = process.env.HOME || "/home/ubuntu";
  for (const app of ["openclaw", "clawdbot", "moltbot"]) {
    const p = path.join(home, `.${app}`, `${app}.json`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadAccount(): ResolvedQQBotAccount | null {
  const configPath = detectConfigPath();
  try {
    if (!configPath || !fs.existsSync(configPath)) {
      const appId = process.env.QQBOT_APP_ID;
      const clientSecret = process.env.QQBOT_CLIENT_SECRET;
      if (appId && clientSecret) {
        return { accountId: "default", appId: normalizeAppId(appId), clientSecret, enabled: true, secretSource: "env", markdownSupport: true, config: {} };
      }
      return null;
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const qqbot = config.channels?.qqbot;
    if (!qqbot) return null;
    return {
      accountId: "default",
      appId: normalizeAppId(qqbot.appId ?? process.env.QQBOT_APP_ID),
      clientSecret: qqbot.clientSecret || process.env.QQBOT_CLIENT_SECRET,
      enabled: qqbot.enabled ?? true,
      secretSource: qqbot.clientSecret ? "config" as const : "env" as const,
      markdownSupport: qqbot.markdownSupport ?? true,
      config: qqbot,
    };
  } catch (err) {
    return null;
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // 清空日志
  fs.writeFileSync(LOG_FILE, "");

  const openid = process.argv[2];
  if (!openid) { log("用法: npx tsx scripts/test-sendmedia.ts <openid>"); process.exit(1); }

  const account = loadAccount();
  if (!account) { log("无法加载账户配置"); process.exit(1); }

  const to = `c2c:${openid}`;
  log(`目标: ${to}\n`);

  // ===== 1. 语音 =====
  log("==================================================");
  log("TEST 1: 语音 (本地 WAV 文件)");
  log("==================================================");
  const wavPath = "/tmp/test-voice.wav";
  if (fs.existsSync(wavPath)) {
    const r1 = await sendMedia({ to, text: "测试语音 sendMedia", mediaUrl: wavPath, account });
    log("结果: " + JSON.stringify(r1, null, 2));
  } else {
    log("跳过: /tmp/test-voice.wav 不存在");
  }

  await sleep(2000);

  // ===== 2. 视频 =====
  log("\n==================================================");
  log("TEST 2: 视频 (公网 MP4 URL)");
  log("==================================================");
  const videoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
  const r2 = await sendMedia({ to, text: "测试视频 sendMedia", mediaUrl: videoUrl, account });
  log("结果: " + JSON.stringify(r2, null, 2));

  await sleep(2000);

  // ===== 3. 文件 =====
  log("\n==================================================");
  log("TEST 3: 文件 (本地 TXT 文件)");
  log("==================================================");
  const txtPath = "/tmp/test-doc.txt";
  if (fs.existsSync(txtPath)) {
    const r3 = await sendMedia({ to, text: "测试文件 sendMedia", mediaUrl: txtPath, account });
    log("结果: " + JSON.stringify(r3, null, 2));
  } else {
    log("跳过: /tmp/test-doc.txt 不存在");
  }

  log("\n==================================================");
  log("全部测试完成");
  log("==================================================");
}

main().catch(err => { log("脚本异常: " + err); process.exit(1); });
