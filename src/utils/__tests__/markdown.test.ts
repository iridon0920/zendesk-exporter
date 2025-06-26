import { MarkdownExporter } from '../markdown';
import { MarkdownTicket, MarkdownComment } from '../../types';

describe('Markdown出力機能', () => {
  const sampleTicket: MarkdownTicket = {
    id: 123,
    subject: 'テストチケット',
    status: 'open',
    priority: 'high',
    type: 'incident',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-02T15:30:00Z',
    requesterName: '田中太郎',
    assigneeName: '佐藤花子',
    tags: ['bug', 'urgent'],
    description: 'これはテスト用の説明文です。',
    comments: [
      {
        id: 1,
        authorName: '田中太郎',
        body: '最初のコメントです。',
        isPublic: true,
        createdAt: '2023-01-01T10:05:00Z',
        attachments: []
      },
      {
        id: 2,
        authorName: '佐藤花子',
        body: '対応中です。',
        isPublic: false,
        createdAt: '2023-01-01T11:00:00Z',
        attachments: [
          {
            id: 1,
            url: 'https://example.com/attachment1.png',
            file_name: 'screenshot.png',
            content_url: 'https://example.com/screenshot.png',
            content_type: 'image/png',
            size: 1024,
            width: 800,
            height: 600,
            inline: false,
            deleted: false
          }
        ]
      }
    ],
    customFields: [
      { id: 1, value: 'カスタム値1' },
      { id: 2, value: null }
    ]
  };

  describe('formatTicket', () => {
    test('単一チケットをMarkdown形式に変換する', () => {
      const result = MarkdownExporter.formatTicket(sampleTicket);

      // フロントマターの確認
      expect(result).toContain('---');
      expect(result).toContain('id: 123');
      expect(result).toContain('subject: "テストチケット"');
      expect(result).toContain('status: open');
      expect(result).toContain('priority: high');
      expect(result).toContain('type: incident');
      expect(result).toContain('requester: "田中太郎"');
      expect(result).toContain('assignee: "佐藤花子"');
      expect(result).toContain('tags: ["bug", "urgent"]');

      // ヘッダーの確認
      expect(result).toContain('# チケット #123: テストチケット');

      // 基本情報テーブルの確認
      expect(result).toContain('## 基本情報');
      expect(result).toContain('| チケットID | 123 |');
      expect(result).toContain('| ステータス | open |');

      // 説明の確認
      expect(result).toContain('## 説明');
      expect(result).toContain('これはテスト用の説明文です。');

      // カスタムフィールドの確認
      expect(result).toContain('## カスタムフィールド');
      expect(result).toContain('- **フィールド 1**: カスタム値1');

      // コメント履歴の確認
      expect(result).toContain('## コメント履歴');
      expect(result).toContain('### 田中太郎');
      expect(result).toContain('最初のコメントです。');
      expect(result).toContain('### 佐藤花子');
      expect(result).toContain('対応中です。');

      // 添付ファイルの確認
      expect(result).toContain('**添付ファイル:**');
      expect(result).toContain('[screenshot.png](https://example.com/screenshot.png)');
    });

    test('担当者がいない場合は表示されない', () => {
      const ticketWithoutAssignee = { ...sampleTicket, assigneeName: undefined };
      const result = MarkdownExporter.formatTicket(ticketWithoutAssignee);

      expect(result).not.toContain('assignee:');
      expect(result).not.toContain('| 担当者 |');
    });

    test('タグがない場合は表示されない', () => {
      const ticketWithoutTags = { ...sampleTicket, tags: [] };
      const result = MarkdownExporter.formatTicket(ticketWithoutTags);

      expect(result).not.toContain('tags:');
      expect(result).not.toContain('| タグ |');
    });

    test('コメントがない場合はコメント履歴セクションが表示されない', () => {
      const ticketWithoutComments = { ...sampleTicket, comments: [] };
      const result = MarkdownExporter.formatTicket(ticketWithoutComments);

      expect(result).not.toContain('## コメント履歴');
    });
  });

  describe('formatTickets', () => {
    test('複数チケットをMarkdown形式に変換する', () => {
      const tickets = [sampleTicket, { ...sampleTicket, id: 124, subject: '2番目のチケット' }];
      const result = MarkdownExporter.formatTickets(tickets);

      // ドキュメントヘッダーの確認
      expect(result).toContain('# Zendesk チケット エクスポート');
      expect(result).toContain('チケット数: 2');

      // 目次の確認
      expect(result).toContain('## 目次');
      expect(result).toContain('- [チケット #123: テストチケット]');
      expect(result).toContain('- [チケット #124: 2番目のチケット]');

      // 各チケットの内容が含まれている確認
      expect(result).toContain('# チケット #123: テストチケット');
      expect(result).toContain('# チケット #124: 2番目のチケット');
    });

    test('単一チケットの場合は目次を表示しない', () => {
      const tickets = [sampleTicket];
      const result = MarkdownExporter.formatTickets(tickets);

      expect(result).toContain('# Zendesk チケット エクスポート');
      expect(result).toContain('チケット数: 1');
      expect(result).not.toContain('## 目次');
    });
  });

  describe('saveToFile', () => {
    test('ファイル保存エラーをキャッチする', async () => {
      // 無効なパスでテスト
      const invalidPath = '/invalid/path/test.md';
      
      await expect(
        MarkdownExporter.saveToFile('test content', invalidPath)
      ).rejects.toThrow('ファイルの保存に失敗しました');
    });
  });
});