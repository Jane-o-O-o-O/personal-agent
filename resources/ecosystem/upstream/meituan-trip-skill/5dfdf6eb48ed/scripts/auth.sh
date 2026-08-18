#!/usr/bin/env bash
# auth.sh — 美团旅行 Skill 鉴权脚本
#
# 用法：
#   bash auth.sh --client_id <client_id> [--env prod|test]
#
# 输出（每行一条，AI 按行解析）：
#   TOKEN_CACHED               — 本地缓存有效，可直接调用业务 CLI
#   QRCODE_IMAGE:<path>        — 二维码图片绝对路径（路径可能含空格，展示时用 <path> 包裹）
#   AUTH_LINK:<url>            — 供用户点击的授权链接
#   ERROR:<message>            — 发生错误，终止流程
#
# 使用说明：
#   - TOKEN_CACHED 时直接进入业务查询，无需轮询
#   - 收到 QRCODE_IMAGE + AUTH_LINK 时：
#       1. 向用户展示二维码图片：![二维码](<path>)
#       2. 向用户展示点击授权链接
#       3. 执行轮询：$PT_BIN auth poll-token --client_id <client_id>
#          等待退出码 0 后继续业务查询
# -------------------------------------------------------------------
set -euo pipefail

CLIENT_ID=""
ENV="prod"

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --client_id) CLIENT_ID="$2"; shift 2 ;;
    --env)       ENV="$2";       shift 2 ;;
    *) shift ;;
  esac
done

if [[ -z "$CLIENT_ID" ]]; then
  echo "ERROR:--client_id 参数必填"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)"
PASSPORT_SCRIPT_DIR="$SCRIPT_DIR/../meituan-passport-user-auth/scripts"

# Step 1: 安装/确认 pt-passport CLI
if ! bash "$PASSPORT_SCRIPT_DIR/install.sh" >/dev/null 2>&1; then
  echo "ERROR:pt-passport 安装失败，请确认 Node.js >= 18 已安装"
  exit 1
fi

# 自动探测 pt-passport 可执行文件路径
if command -v pt-passport &>/dev/null; then
  PT_BIN="$(command -v pt-passport)"
else
  # 回退：从 npm 全局 bin 路径查找
  NPM_BIN="$(npm bin -g 2>/dev/null || npm prefix -g 2>/dev/null)/bin"
  if [ -x "$NPM_BIN/pt-passport" ]; then
    PT_BIN="$NPM_BIN/pt-passport"
  else
    echo "ERROR:找不到 pt-passport 可执行文件，请确认已通过 npm install -g 安装"
    exit 1
  fi
fi

# Step 2: 尝试读取缓存 Token
if "$PT_BIN" get-token --client_id "$CLIENT_ID" --env "$ENV" >/dev/null 2>&1; then
  echo "TOKEN_CACHED"
  exit 0
fi

# Step 3: 无缓存，发起授权，获取链接
GET_CODE_OUTPUT=$("$PT_BIN" auth get-code --client_id "$CLIENT_ID" --env "$ENV" 2>/dev/null)

# 检查是否直接返回了有效 Token（缓存刚刷新场景）
if echo "$GET_CODE_OUTPUT" | grep -q "^Token:"; then
  echo "TOKEN_CACHED"
  exit 0
fi

# 检查错误
if echo "$GET_CODE_OUTPUT" | grep -q "^❌"; then
  ERR_MSG=$(echo "$GET_CODE_OUTPUT" | grep "^❌" | head -1)
  echo "ERROR:$ERR_MSG"
  exit 1
fi

# 提取 DIRECT_AUTH_LINK（用于生成二维码）和 AUTH_LINK（用于展示给用户）
DIRECT_AUTH_LINK=$(echo "$GET_CODE_OUTPUT" | grep "^DIRECT_AUTH_LINK:" | sed 's/^DIRECT_AUTH_LINK: *//' | head -1)
AUTH_LINK=$(echo "$GET_CODE_OUTPUT" | grep "^AUTH_LINK:" | sed 's/^AUTH_LINK: *//' | head -1)

if [[ -z "$AUTH_LINK" ]]; then
  echo "ERROR:未获取到授权链接，pt-passport 输出异常"
  exit 1
fi

# 用于生成二维码的链接优先用 DIRECT_AUTH_LINK
QR_URL="${DIRECT_AUTH_LINK:-$AUTH_LINK}"

# Step 4: 生成二维码图片
QRCODE_OUTPUT=$(bash "$PASSPORT_SCRIPT_DIR/qrcode-image.sh" "$QR_URL" "$CLIENT_ID" 2>/dev/null)

if echo "$QRCODE_OUTPUT" | grep -q "^QRCODE_IMAGE:"; then
  QRCODE_PATH=$(echo "$QRCODE_OUTPUT" | grep "^QRCODE_IMAGE:" | sed 's/^QRCODE_IMAGE://')
  echo "QRCODE_IMAGE:$QRCODE_PATH"
fi

# 输出 AUTH_LINK（供 AI 展示给用户）
echo "AUTH_LINK:$AUTH_LINK"

