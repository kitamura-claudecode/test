# Google Calendar → iCloud 同期

`kitamura@soundtec-inc.com` の Google カレンダーの未来の予定を、片方向で iCloud カレンダーへ自動コピーするスクリプトです。

- 言語: Python 3.11+
- iCloud: CalDAV (`caldav.icloud.com`) + アプリ用パスワード
- 実行: launchd (macOS) / cron で 1 時間ごと

リポジトリにもともと入っていた目覚まし時計の Web アプリ (`app.js` / `index.html` / `style.css`) は同期スクリプトとは無関係です。

## ファイル構成

```
sync/
├── sync.py                 メインスクリプト
├── gcal_client.py          Google Calendar API クライアント
├── icloud_client.py        iCloud CalDAV クライアント
├── mapper.py               Google Event → iCalendar VEVENT 変換
├── state.py                同期状態(JSON)の読み書き
├── requirements.txt
├── config.example.yaml     設定テンプレ
├── .env.example            認証情報テンプレ
└── launchd/
    └── com.kitamura.gcal-icloud-sync.plist
```

## セットアップ

### 1. 依存ライブラリ

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r sync/requirements.txt
```

### 2. Google OAuth クライアントを発行

1. <https://console.cloud.google.com/> でプロジェクトを作成 (既存のもので可)
2. 「API とサービス」→「ライブラリ」で **Google Calendar API** を有効化
3. 「API とサービス」→「認証情報」→ OAuth クライアントID を作成
   - アプリケーションの種類: **デスクトップ アプリ**
4. ダウンロードした JSON を `sync/credentials/client_secret.json` に保存

### 3. iCloud のアプリ用パスワードを発行

1. <https://appleid.apple.com> にログイン
2. 「サインインとセキュリティ」→「アプリ用パスワード」→ 新規発行
3. 表示された `xxxx-xxxx-xxxx-xxxx` 形式のパスワードをメモ

### 4. iCloud に書き込み先カレンダーを作成

Mac の「カレンダー.app」で **`Synced from Google`** という名前のカレンダーを iCloud アカウント配下に新規作成しておきます (CalDAV 経由でのカレンダー作成は不安定なため事前作成を推奨)。
別名にしたい場合は `sync/config.yaml` の `icloud.calendar_name` を合わせて変更してください。

### 5. 設定ファイル

```bash
cp sync/config.example.yaml sync/config.yaml
cp sync/.env.example sync/.env
```

それぞれ編集:
- `sync/config.yaml`: 同期元カレンダー ID (`primary` でログイン中のメインカレンダー)、未来何日分か (既定 60 日)
- `sync/.env`: `APPLE_ID`、`APPLE_APP_PASSWORD`、Google クライアントシークレットのパス

### 6. 初回 OAuth 認可

```bash
python sync/sync.py --auth
```

ブラウザが開くので `kitamura@soundtec-inc.com` でログインし、Calendar の読み取り権限を許可。`sync/credentials/token.json` が生成されれば成功です。

### 7. ドライラン

書き込まずに「作成/更新/削除予定」だけ表示:

```bash
python sync/sync.py --dry-run
```

### 8. 本実行

```bash
python sync/sync.py
```

`sync/state.json` (同期マップ) と `sync/sync.log` が生成されます。iCloud カレンダーアプリで予定の反映を目視確認してください。

## 定期実行 (launchd / macOS)

`sync/launchd/com.kitamura.gcal-icloud-sync.plist` の `WorkingDirectory` と `ProgramArguments` の絶対パスをあなたの環境に合わせて編集してから:

```bash
cp sync/launchd/com.kitamura.gcal-icloud-sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.kitamura.gcal-icloud-sync.plist
```

1 時間ごとに実行され、ログは `~/Library/Logs/gcal-icloud-sync.log` に追記されます。

停止する場合:

```bash
launchctl unload ~/Library/LaunchAgents/com.kitamura.gcal-icloud-sync.plist
```

## 定期実行 (cron / Linux)

```cron
0 * * * * cd /path/to/repo && /path/to/repo/.venv/bin/python sync/sync.py >> sync/sync.log 2>&1
```

## 同期の挙動

- **対象**: 今日から `days_ahead` 日先まで (既定 60 日)。`singleEvents=False` のため、繰り返し予定は元の RRULE のまま 1 件として転送します。
- **新規**: Google にあって state に無いイベント → iCloud に作成
- **更新**: Google の `updated` が state の保存値より新しい → iCloud 上を上書き
- **削除**: Google で `status=cancelled` または応答から消えた → iCloud からも削除
- **方向**: 片方向 (Google → iCloud) のみ。iCloud 側で編集した内容は次回実行で上書きされます。
- 招待者 (attendees) は安全側で転送しません (二重招待メール防止)。

## トラブルシュート

| 症状 | 対処 |
|------|------|
| `iCloud calendar named '…' not found` | カレンダー.app で同名のカレンダーを iCloud 配下に作成 |
| `invalid_grant` | `sync/credentials/token.json` を削除して `--auth` 再実行 |
| CalDAV 401 | アプリ用パスワードを再発行して `.env` を更新 |
| `client_secret.json` not found | Google Cloud Console で OAuth クライアント (デスクトップ) を発行 |
