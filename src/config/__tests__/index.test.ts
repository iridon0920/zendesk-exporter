import { 
  loadConfigFromEnv, 
  parseExportOptions, 
  validateConfig,
  resolveConfig
} from '../index';
import { ZendeskConfig } from '../../types';

// 環境変数のモック
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('設定管理機能', () => {
  describe('loadConfigFromEnv', () => {
    test('環境変数から設定を読み込む', () => {
      process.env.ZENDESK_SUBDOMAIN = 'test-subdomain';
      process.env.ZENDESK_EMAIL = 'test@example.com';
      process.env.ZENDESK_TOKEN = 'test-token';

      const config = loadConfigFromEnv();

      expect(config).toEqual({
        subdomain: 'test-subdomain',
        email: 'test@example.com',
        token: 'test-token',
      });
    });

    test('環境変数が設定されていない場合はundefinedを返す', () => {
      delete process.env.ZENDESK_SUBDOMAIN;
      delete process.env.ZENDESK_EMAIL;
      delete process.env.ZENDESK_TOKEN;

      const config = loadConfigFromEnv();

      expect(config).toEqual({
        subdomain: undefined,
        email: undefined,
        token: undefined,
      });
    });
  });

  describe('parseExportOptions', () => {
    test('基本的なオプションを解析する', () => {
      const options = {
        output: 'test-output.md',
        tags: 'tag1,tag2,tag3',
        form: '12345'
      };

      const result = parseExportOptions(options);

      expect(result).toEqual({
        output: 'test-output.md',
        tags: ['tag1', 'tag2', 'tag3'],
        form: '12345'
      });
    });

    test('デフォルト値が設定される', () => {
      const options = {};

      const result = parseExportOptions(options);

      expect(result).toEqual({
        output: 'tickets.md'
      });
    });

    test('タグをトリムして配列に変換する', () => {
      const options = {
        tags: ' tag1 , tag2 , tag3 '
      };

      const result = parseExportOptions(options);

      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('validateConfig', () => {
    test('有効な設定の場合は例外をスローしない', () => {
      const config: ZendeskConfig = {
        subdomain: 'test-subdomain',
        email: 'test@example.com',
        token: 'test-token'
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    test('サブドメインが無効な場合は例外をスローする', () => {
      const config = {
        subdomain: '',
        email: 'test@example.com',
        token: 'test-token'
      } as ZendeskConfig;

      expect(() => validateConfig(config)).toThrow('無効なサブドメインです');
    });

    test('メールアドレスが無効な場合は例外をスローする', () => {
      const config = {
        subdomain: 'test-subdomain',
        email: 'invalid-email',
        token: 'test-token'
      } as ZendeskConfig;

      expect(() => validateConfig(config)).toThrow('無効なメールアドレスです');
    });

    test('トークンが無効な場合は例外をスローする', () => {
      const config = {
        subdomain: 'test-subdomain',
        email: 'test@example.com',
        token: ''
      } as ZendeskConfig;

      expect(() => validateConfig(config)).toThrow('無効なAPIトークンです');
    });
  });
});