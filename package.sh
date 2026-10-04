#!/usr/bin/env bash
#
# 蜗牛壳AI助理 · 一键发布打包脚本
# 用法：在扩展根目录执行  ./package.sh
# 产物：../snailshell-v<version>.zip  （manifest.json 位于 ZIP 顶层）
#
set -euo pipefail

cd "$(dirname "$0")"

# 1) 读取版本号（优先 jq，否则用 grep/sed 兜底）
if command -v jq >/dev/null 2>&1; then
  VERSION="$(jq -r .version manifest.json)"
else
  VERSION="$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' manifest.json | head -1 | sed 's/.*:[[:space:]]*//; s/"//g')"
fi

if [ -z "${VERSION:-}" ]; then
  echo "✗ 无法从 manifest.json 读取 version" >&2
  exit 1
fi

OUT="../snailshell-v${VERSION}.zip"
rm -f "$OUT"

# 2) 命令行 zip（避免 macOS 右键压缩产生 __MACOSX 垃圾目录）
#    排除开发/上架素材，确保只打入运行时需要的内容
zip -r "$OUT" . \
  -x "*.git*" \
     "scripts/*" \
     "publish/*" \
     "icons/backup/*" \
     "__MACOSX/*" \
     "*.DS_Store" \
     "README.md" \
     "package.sh" \
     "*.zip"

# 3) 校验 manifest.json 在 ZIP 顶层
if unzip -l "$OUT" | grep -q "manifest.json"; then
  echo "✓ 已生成 $OUT  (version $VERSION)"
  echo "  顶层文件校验："
  unzip -l "$OUT" | sed -n '4,$p' | grep -E "manifest.json|icons/|src/" | head -20
else
  echo "✗ 打包异常：manifest.json 不在 ZIP 顶层" >&2
  exit 1
fi
