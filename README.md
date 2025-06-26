# Zendesk Exporter

ZendeskチケットをMarkdown形式でエクスポートするCLIツールです。

## 特徴

- チケットをMarkdown形式で出力
- タグ・フォームIDによるフィルタリング機能
- 設定ファイル・環境変数・CLI引数による柔軟な設定管理
- 日本語対応
- TypeScript実装

## インストール

```bash
npm install
npm run build
```

## 設定

以下の3つの方法で設定できます（優先順位: CLI引数 > 環境変数 > 設定ファイル）：

### 1. 環境変数

```bash
export ZENDESK_SUBDOMAIN="your-subdomain"
export ZENDESK_EMAIL="your-email@example.com"
export ZENDESK_TOKEN="your-api-token"
```

### 2. 設定ファイル

プロジェクトルートに `zendesk-settings.json` を作成：

```json
{
  "subdomain": "your-subdomain",
  "email": "your-email@example.com",
  "token": "your-api-token"
}
```

### 3. CLI引数

```bash
npx zendesk-exporter tickets --subdomain your-subdomain --email your-email@example.com --token your-api-token
```

## 使用方法

### チケットのエクスポート

```bash
# 基本的な使用法
npx zendesk-exporter tickets

# 出力ファイルを指定
npx zendesk-exporter tickets --output my-tickets.md

# タグでフィルタ
npx zendesk-exporter tickets --tags "bug,urgent"

# フォームIDでフィルタ
npx zendesk-exporter tickets --form 123456

# 複数オプションの組み合わせ
npx zendesk-exporter tickets --tags "bug,high-priority" --output bug-tickets.md
```

### 設定ファイルの生成

```bash
npx zendesk-exporter config
```

### 接続テスト

```bash
npx zendesk-exporter test
```

## コマンド

### `tickets`

チケットをMarkdown形式でエクスポートします。

**オプション:**
- `--tags <tags>`: フィルタ条件（タグ、カンマ区切り）
- `--form <form>`: フィルタ条件（フォームID）
- `--output <path>`: 出力ファイルパス（デフォルト: tickets.md）
- `--subdomain <subdomain>`: Zendeskサブドメイン
- `--email <email>`: Zendeskメールアドレス
- `--token <token>`: Zendesk APIトークン

### `config`

設定ファイルのサンプルを生成します。

### `test`

Zendesk APIへの接続をテストします。

## 出力形式

エクスポートされるMarkdownファイルには以下の情報が含まれます：

- チケット基本情報（ID、ステータス、優先度、タイプなど）
- 作成者・担当者情報
- タグ
- 説明文
- コメント履歴（作成者、本文、公開/非公開、添付ファイル）
- カスタムフィールド
- フロントマター（YAML形式のメタデータ）

## 開発

### スクリプト

```bash
# 開発用実行
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# テスト（監視モード）
npm run test:watch
```

### プロジェクト構造

```
src/
├── cli/           # CLI entry point and command handlers
├── services/      # Zendesk API service layer  
├── types/         # TypeScript type definitions
├── utils/         # Utility functions (Markdown export)
└── config/        # Configuration management
```

## ライセンス

MIT

## 注意事項

- APIレート制限を避けるため、チケット処理間に100ms の待機時間を設けています
- 大量のチケットをエクスポートする場合は時間がかかる場合があります（チケット数 × コメント数により処理時間が決まります）
- コメントが多いチケットの場合、処理時間がさらに長くなる可能性があります

## トラブルシューティング

### 認証エラー

- サブドメイン、メールアドレス、APIトークンが正しく設定されているか確認してください
- ZendeskでAPIトークンが有効になっているか確認してください

### 接続エラー

```bash
npx zendesk-exporter test
```

で接続をテストできます。

### その他

詳細なエラー情報については、コマンド実行時のログを確認してください。