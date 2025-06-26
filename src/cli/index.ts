#!/usr/bin/env node

import { Command } from 'commander';
import { resolveConfig, parseExportOptions, createSampleConfig } from '../config';
import { ZendeskService } from '../services/zendesk';
import { MarkdownExporter } from '../utils/markdown';
import { TicketFilter } from '../types';

const program = new Command();

// CLI基本設定
program
  .name('zendesk-exporter')
  .description('ZendeskチケットをMarkdown形式でエクスポートするCLIツール')
  .version('1.0.0');

// ticketsコマンド
program
  .command('tickets')
  .description('Zendeskチケットをエクスポート')
  .option('--tags <tags>', 'フィルタ条件: タグ（カンマ区切り）')
  .option('--form <form>', 'フィルタ条件: フォームID')
  .option('--output <path>', '出力ファイルパス', 'tickets.md')
  .option('--subdomain <subdomain>', 'Zendeskサブドメイン')
  .option('--email <email>', 'Zendeskメールアドレス')
  .option('--token <token>', 'Zendesk APIトークン')
  .action(async (options) => {
    try {
      console.log('Zendeskチケットエクスポートを開始します...');
      
      // 設定の解決
      const config = await resolveConfig({
        subdomain: options.subdomain,
        email: options.email,
        token: options.token,
      });
      
      // エクスポートオプションの解析
      const exportOptions = parseExportOptions(options);
      
      console.log(`接続先: ${config.subdomain}.zendesk.com`);
      console.log(`出力ファイル: ${exportOptions.output}`);
      
      if (exportOptions.tags) {
        console.log(`タグフィルタ: ${exportOptions.tags.join(', ')}`);
      }
      
      if (exportOptions.form) {
        console.log(`フォームIDフィルタ: ${exportOptions.form}`);
      }
      
      // Zendeskサービスの初期化
      const zendeskService = new ZendeskService(config);
      
      // 接続テスト
      console.log('Zendeskへの接続をテストしています...');
      const isConnected = await zendeskService.testConnection();
      if (!isConnected) {
        throw new Error('Zendeskへの接続に失敗しました。設定を確認してください。');
      }
      console.log('✓ Zendeskへの接続が成功しました');
      
      // フィルタの構築
      const filter: TicketFilter = {};
      if (exportOptions.tags) {
        filter.tags = exportOptions.tags;
      }
      if (exportOptions.form) {
        filter.formId = exportOptions.form;
      }
      
      // チケットの取得
      console.log('チケットを取得しています...');
      const tickets = await zendeskService.getTicketsWithFilter(filter);
      console.log(`✓ ${tickets.length}件のチケットを取得しました`);
      
      if (tickets.length === 0) {
        console.log('エクスポート対象のチケットがありません。');
        return;
      }
      
      // チケットをMarkdown形式に変換
      console.log('チケットをMarkdown形式に変換しています...');
      const markdownTickets = await zendeskService.convertTicketsToMarkdown(tickets);
      console.log(`✓ ${markdownTickets.length}件のチケットを変換しました`);
      
      // Markdownファイルに出力
      console.log('Markdownファイルを出力しています...');
      await MarkdownExporter.exportTickets(markdownTickets, exportOptions.output);
      console.log('✓ エクスポートが完了しました');
      
    } catch (error) {
      console.error('エラー:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// configコマンド（設定ファイル生成）
program
  .command('config')
  .description('設定ファイルのサンプルを生成')
  .action(async () => {
    try {
      await createSampleConfig();
    } catch (error) {
      console.error('エラー:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// testコマンド（接続テスト）
program
  .command('test')
  .description('Zendesk接続をテスト')
  .option('--subdomain <subdomain>', 'Zendeskサブドメイン')
  .option('--email <email>', 'Zendeskメールアドレス')
  .option('--token <token>', 'Zendesk APIトークン')
  .action(async (options) => {
    try {
      console.log('Zendesk接続テストを実行します...');
      
      // 設定の解決
      const config = await resolveConfig({
        subdomain: options.subdomain,
        email: options.email,
        token: options.token,
      });
      
      console.log(`接続先: ${config.subdomain}.zendesk.com`);
      console.log(`メールアドレス: ${config.email}`);
      
      // Zendeskサービスの初期化と接続テスト
      const zendeskService = new ZendeskService(config);
      const isConnected = await zendeskService.testConnection();
      
      if (isConnected) {
        console.log('✓ Zendeskへの接続が成功しました');
      } else {
        console.log('✗ Zendeskへの接続に失敗しました');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('エラー:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ヘルプとして使用例を表示
program.on('--help', () => {
  console.log('');
  console.log('使用例:');
  console.log('  $ zendesk-exporter tickets --output my-tickets.md');
  console.log('  $ zendesk-exporter tickets --tags "bug,urgent" --output bug-tickets.md');
  console.log('  $ zendesk-exporter tickets --form 123456 --output form-tickets.md');
  console.log('  $ zendesk-exporter config');
  console.log('  $ zendesk-exporter test');
  console.log('');
  console.log('環境変数:');
  console.log('  ZENDESK_SUBDOMAIN  Zendeskサブドメイン');
  console.log('  ZENDESK_EMAIL      Zendeskメールアドレス');
  console.log('  ZENDESK_TOKEN      Zendesk APIトークン');
  console.log('');
  console.log('設定ファイル:');
  console.log('  zendesk-settings.json  プロジェクトルートに配置');
});

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のPromise拒否:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('キャッチされていない例外:', error);
  process.exit(1);
});

// プログラムの実行
program.parse();