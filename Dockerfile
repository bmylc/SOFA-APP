# SOFA 開発用コンテナ（Expo 開発サーバー・テスト実行用）
# Expo SDK 58 の要件: Node 22.13+ / 24.3+ / 26+（奇数バージョンは非対応）
FROM node:24-bookworm-slim

# git: expo CLI が利用 / procps: Metro のプロセス管理
RUN apt-get update \
  && apt-get install -y --no-install-recommends git procps ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存関係だけ先にインストールしてレイヤーキャッシュを効かせる
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Metro（開発サーバー）
EXPOSE 8081

ENV EXPO_NO_TELEMETRY=1 \
    CI=0

CMD ["npx", "expo", "start", "--lan"]
