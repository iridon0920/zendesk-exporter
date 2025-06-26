# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Zendesk チケット内容をMarkdown形式で出力するCLIツール。TypeScript + Node.jsで実装。

## Tech Stack
- **Language**: TypeScript + Node.js
- **CLI Framework**: commander.js
- **Zendesk API**: `zendesk-api-client-typescript`
- **Build Tool**: TypeScript Compiler (tsc)
- **Test Framework**: Jest (予定)

## Project Structure
```
src/
├── cli/           # CLI entry point and command handlers
├── services/      # Zendesk API service layer
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── config/        # Configuration management
```

## Key Commands
- `npm run build`: TypeScriptコンパイル
- `npm test`: テスト実行
- `npm run dev`: 開発用実行 (ts-node)
- `npx zendesk-exporter tickets`: メインコマンド

## CLI Interface
```bash
npx zendesk-exporter tickets [options]
  --tags <tags>       # フィルタ条件: タグ（カンマ区切り）
  --form <form>       # フィルタ条件: フォームID
  --output <path>     # 出力ファイルパス (デフォルト: tickets.md)
```

## Configuration
設定方法（優先順位）:
1. CLI arguments
2. Environment variables
3. `zendesk-settings.json`

必要な設定:
- `ZENDESK_SUBDOMAIN`: Zendeskサブドメイン
- `ZENDESK_EMAIL`: 認証用メールアドレス  
- `ZENDESK_TOKEN`: API token

## Output Format
単一Markdownファイルに全対象チケットを出力:
- チケット基本情報（ID、ステータス、作成日時等）
- 説明文
- コメント履歴（ステータス変更含む）
- メタデータをFrontmatter形式で含む

## Reference Architecture
Backlog Exporterツール（https://dev.classmethod.jp/articles/backlog-exporter/）の構造を参考に実装