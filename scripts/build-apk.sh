#!/usr/bin/env bash
# Docker コンテナ内で APK をビルドする（docker compose run --rm apk から呼ばれる）
#   /app  … ホストのプロジェクト（読み取り元・APK の出力先）
#   /work … ビルド作業用（Docker ボリューム。node_modules などを使い回す）
set -euo pipefail

SRC=/app
WORK=/work
OUT_DIR="$SRC/dist-apk"

echo "▶ ソースを作業ディレクトリへ同期"
rsync -a --delete \
  --exclude node_modules --exclude android --exclude ios \
  --exclude .git --exclude .expo --exclude dist-apk --exclude build.log \
  "$SRC"/ "$WORK"/

cd "$WORK"

# package-lock.json が変わったときだけ npm ci をやり直す
LOCK_HASH="$(sha1sum package-lock.json | cut -d' ' -f1)"
if [ ! -f node_modules/.lock-hash ] || [ "$(cat node_modules/.lock-hash)" != "$LOCK_HASH" ]; then
  echo "▶ 依存関係をインストール（npm ci）"
  npm ci --no-audit --no-fund
  echo "$LOCK_HASH" > node_modules/.lock-hash
else
  echo "▶ 依存関係は前回と同じためスキップ"
fi

echo "▶ android フォルダを生成（expo prebuild）"
npx expo prebuild --platform android --clean --no-install

echo "▶ APK をビルド（gradlew assembleRelease）"
cd android
./gradlew assembleRelease --no-daemon --console=plain

mkdir -p "$OUT_DIR"
APK_NAME="SOFA-$(date +%Y%m%d-%H%M%S).apk"
cp app/build/outputs/apk/release/app-release.apk "$OUT_DIR/$APK_NAME"

echo ""
echo "✅ APK を出力しました: dist-apk/$APK_NAME"
echo "   ※ デバッグ用キーストアで署名されています（ストア配布には使えません）"
