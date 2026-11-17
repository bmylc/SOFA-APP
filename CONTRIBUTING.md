# 開発に参加するには（SOFA）

Expo SDK 58（React Native 0.88）のアプリです。開発環境は Docker でそろえます。

## 1. 必要なもの

| もの | 用途 |
|---|---|
| [Git](https://git-scm.com/) | ソースコードの取得・共有 |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 開発サーバー・テストの実行環境 |
| GitHub アカウント | リポジトリへの招待を受ける |
| スマホ（Android / iOS） | アプリの動作確認（PC と同じ Wi-Fi に接続） |

Windows の場合は、Docker Desktop の設定で **WSL 2 ベースのエンジン** を使ってください。

## 2. 初回セットアップ

1. GitHub の招待メール（または https://github.com/notifications ）から **リポジトリへの招待を承認** します。
2. リポジトリを取得します。
   ```bash
   git clone https://github.com/bmylc/SOFA-APP.git
   cd SOFA-APP
   ```
   > Windows では、WSL（Ubuntu）のホームディレクトリ（例: `~/projects`）に clone すると、ファイル変更の反映が速く確実です。
3. `.env.example` を `.env` にコピーし、`HOST_LAN_IP` を自分の PC の LAN 内 IP アドレスに書き換えます。
   - Windows: `ipconfig` の「IPv4 アドレス」
   - macOS: `ipconfig getifaddr en0`
4. コンテナをビルドします（初回は数分かかります）。
   ```bash
   docker compose build
   ```

## 3. 毎日の開発

### 開発サーバーを起動
```bash
docker compose up
```
表示された QR コードをスマホで読み取って接続します。

- 終了は `Ctrl + C`
- スマホ側の接続先: このアプリはカメラ・NFC などネイティブ機能を使うため、**開発ビルド（development build）** を入れておくのがおすすめです（Expo Go は SDK 58 用の最新版が必要で、一部機能が動きません）。

### テストを実行
```bash
docker compose run --rm app npm test
```

### パッケージを追加したとき
`package.json` が変わったら（自分で追加した／pull で変わった）、コンテナを作り直します。
```bash
docker compose build
docker compose run --rm app npm ci
```
パッケージの追加は Expo のバージョンに合わせるため `npx expo install <パッケージ名>` を使ってください。
```bash
docker compose run --rm app npx expo install <パッケージ名>
```

## 4. Git の進め方

`main` に直接 push せず、ブランチを切って Pull Request（PR）で取り込みます。

```bash
git switch main
git pull
git switch -c feature/やること     # 例: feature/trade-qr
# … 編集・テスト …
git add .
git commit -m "feat: 〇〇を追加"
git push -u origin feature/やること
```
GitHub で PR を作成し、もう一人がレビューしてからマージします。

PR を作ると GitHub Actions（CI）が自動でテスト・Expo チェック・Docker ビルドを実行します。CI が失敗している PR はマージしないでください。push 前に手元でも `docker compose run --rm app npm test` を実行しておくと安心です。

コミットメッセージの頭には `feat:`（機能）/ `fix:`（修正）/ `docs:`（ドキュメント）/ `chore:`（その他）を付けます。

## 5. APK のビルド

APK はクラウド（EAS Build）で作ります。Expo アカウントが必要で、プロジェクトのオーナーから Expo の組織に招待してもらってください。
```bash
docker compose run --rm app npx eas-cli build -p android --profile preview
```

## 6. コミットしてはいけないもの

`.gitignore` で除外済みですが、次のものは絶対にコミットしないでください。

- `.env`、`Api key*.txt`、各種鍵ファイル（`*.jks` `*.key` `*.p12` など）
- `node_modules/`、`android/`、`ios/`（自動生成）

このリポジトリは **公開（public）** です。パスワードや個人情報をコード・コミットに含めないよう注意してください。
