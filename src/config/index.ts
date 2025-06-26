import { promises as fs } from 'fs';
import { join } from 'path';
import { ZendeskConfig, ExportOptions } from '../types';

const CONFIG_FILE = 'zendesk-settings.json';

// 設定ファイルの読み込み
export async function loadConfigFromFile(): Promise<Partial<ZendeskConfig>> {
  try {
    const configPath = join(process.cwd(), CONFIG_FILE);
    const configContent = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    // 設定ファイルが存在しない場合は空のオブジェクトを返す
    return {};
  }
}

// 環境変数から設定を読み込み
export function loadConfigFromEnv(): Partial<ZendeskConfig> {
  return {
    subdomain: process.env.ZENDESK_SUBDOMAIN,
    email: process.env.ZENDESK_EMAIL,
    token: process.env.ZENDESK_TOKEN,
  };
}

// 設定を統合（優先順位: CLI引数 > 環境変数 > 設定ファイル）
export async function resolveConfig(
  cliConfig: Partial<ZendeskConfig> = {}
): Promise<ZendeskConfig> {
  const fileConfig = await loadConfigFromFile();
  const envConfig = loadConfigFromEnv();

  const config = {
    ...fileConfig,
    ...envConfig,
    ...cliConfig,
  };

  // 必須項目の検証
  if (!config.subdomain) {
    throw new Error('Zendeskサブドメインが設定されていません。ZENDESK_SUBDOMAINを設定するか、zendesk-settings.jsonファイルを作成してください。');
  }

  if (!config.email) {
    throw new Error('Zendeskメールアドレスが設定されていません。ZENDESK_EMAILを設定するか、zendesk-settings.jsonファイルを作成してください。');
  }

  if (!config.token) {
    throw new Error('ZendeskAPIトークンが設定されていません。ZENDESK_TOKENを設定するか、zendesk-settings.jsonファイルを作成してください。');
  }

  return config as ZendeskConfig;
}

// 設定ファイルのサンプルを作成
export async function createSampleConfig(): Promise<void> {
  const sampleConfig = {
    subdomain: 'your-subdomain',
    email: 'your-email@example.com',
    token: 'your-api-token'
  };

  const configPath = join(process.cwd(), CONFIG_FILE);
  await fs.writeFile(configPath, JSON.stringify(sampleConfig, null, 2));
  console.log(`サンプル設定ファイルを作成しました: ${configPath}`);
}

// 設定の検証
export function validateConfig(config: ZendeskConfig): void {
  if (!config.subdomain || typeof config.subdomain !== 'string') {
    throw new Error('無効なサブドメインです');
  }

  if (!config.email || typeof config.email !== 'string' || !config.email.includes('@')) {
    throw new Error('無効なメールアドレスです');
  }

  if (!config.token || typeof config.token !== 'string') {
    throw new Error('無効なAPIトークンです');
  }
}

// エクスポートオプションの処理
export function parseExportOptions(options: any): ExportOptions {
  const exportOptions: ExportOptions = {
    output: options.output || 'tickets.md'
  };

  // タグの処理（カンマ区切り文字列を配列に変換）
  if (options.tags) {
    exportOptions.tags = options.tags.split(',').map((tag: string) => tag.trim());
  }

  // フォームIDの処理
  if (options.form) {
    exportOptions.form = options.form;
  }

  return exportOptions;
}