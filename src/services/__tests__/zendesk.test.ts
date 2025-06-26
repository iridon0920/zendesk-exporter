import { ZendeskService } from '../zendesk';
import { ZendeskConfig } from '../../types';
import { Ticket, User } from 'zendesk-api-client-typescript';
import type { Comment } from 'zendesk-api-client-typescript/dist/types/ticket';

// ZendeskClientのモック
jest.mock('zendesk-api-client-typescript', () => ({
  ZendeskClient: jest.fn().mockImplementation(() => ({
    search: {
      searchTickets: jest.fn()
    },
    tickets: {
      list: jest.fn(),
      listComments: jest.fn()
    },
    users: {
      me: jest.fn(),
      show: jest.fn()
    }
  }))
}));

const mockConfig: ZendeskConfig = {
  subdomain: 'test-subdomain',
  email: 'test@example.com',
  token: 'test-token'
};

const mockTicket: Ticket = {
  id: 123,
  url: 'https://test.zendesk.com/api/v2/tickets/123.json',
  created_at: '2023-01-01T10:00:00Z',
  updated_at: '2023-01-02T15:30:00Z',
  type: 'incident',
  subject: 'テストチケット',
  description: 'これはテスト用の説明文です。',
  priority: 'high',
  status: 'open',
  requester_id: 1001,
  submitter_id: 1001,
  assignee_id: 1002,
  tags: ['bug', 'urgent'],
  custom_fields: [{ id: 1, value: 'カスタム値1' }]
};

const mockUser: User = {
  id: 1001,
  url: 'https://test.zendesk.com/api/v2/users/1001.json',
  name: '田中太郎',
  email: 'tanaka@example.com',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  role: 'end-user',
  verified: true,
  active: true
};

const mockComment: Comment = {
  id: 1,
  type: 'Comment',
  author_id: 1001,
  body: 'テストコメント',
  html_body: '<p>テストコメント</p>',
  plain_body: 'テストコメント',
  public: true,
  attachments: [
    {
      id: 1,
      url: 'https://example.com/attachment1.png',
      file_name: 'screenshot.png',
      content_url: 'https://example.com/content/attachment1.png',
      content_type: 'image/png',
      size: 1024,
      width: 800,
      height: 600,
      inline: false,
      deleted: false
    }
  ],
  created_at: '2023-01-01T10:05:00Z'
};

describe('ZendeskService', () => {
  let service: ZendeskService;
  let mockClient: any;

  beforeEach(() => {
    const { ZendeskClient } = require('zendesk-api-client-typescript');
    service = new ZendeskService(mockConfig);
    mockClient = (service as any).client;
  });

  describe('getTicketsWithFilter', () => {
    test('タグフィルタでチケットを検索する', async () => {
      const mockSearchResults = {
        results: [mockTicket]
      };
      mockClient.search.searchTickets.mockResolvedValue(mockSearchResults);

      const filter = { tags: ['bug', 'urgent'] };
      const result = await service.getTicketsWithFilter(filter);

      expect(mockClient.search.searchTickets).toHaveBeenCalledWith({ query: 'tags:bug tags:urgent' });
      expect(result).toEqual([mockTicket]);
    });

    test('フォームIDフィルタでチケットを検索する', async () => {
      const mockSearchResults = {
        results: [mockTicket]
      };
      mockClient.search.searchTickets.mockResolvedValue(mockSearchResults);

      const filter = { formId: '12345' };
      const result = await service.getTicketsWithFilter(filter);

      expect(mockClient.search.searchTickets).toHaveBeenCalledWith({ query: 'ticket_form_id:12345' });
      expect(result).toEqual([mockTicket]);
    });

    test('フィルタなしの場合は全チケットを取得する', async () => {
      const mockTicketsResponse = {
        tickets: [mockTicket]
      };
      mockClient.tickets.list.mockResolvedValue(mockTicketsResponse);

      const filter = {};
      const result = await service.getTicketsWithFilter(filter);

      expect(mockClient.tickets.list).toHaveBeenCalled();
      expect(result).toEqual([mockTicket]);
    });

    test('APIエラーの場合は例外をスローする', async () => {
      mockClient.search.searchTickets.mockRejectedValue(new Error('API Error'));

      const filter = { tags: ['bug'] };

      await expect(service.getTicketsWithFilter(filter)).rejects.toThrow('チケットの取得に失敗しました');
    });
  });

  describe('getTicketComments', () => {
    test('チケットのコメントを取得する', async () => {
      const mockCommentsResponse = {
        comments: [mockComment],
        count: 1
      };
      mockClient.tickets.listComments.mockResolvedValue(mockCommentsResponse);

      const result = await service.getTicketComments(123);

      expect(mockClient.tickets.listComments).toHaveBeenCalledWith(123, { sort_order: 'asc' });
      expect(result).toEqual([mockComment]);
    });

    test('APIエラーの場合は例外をスローする', async () => {
      mockClient.tickets.listComments.mockRejectedValue(new Error('API Error'));

      await expect(service.getTicketComments(123)).rejects.toThrow('チケット123のコメント取得に失敗しました');
    });
  });

  describe('getUser', () => {
    test('ユーザー情報を取得する', async () => {
      const mockUserResponse = {
        user: mockUser
      };
      mockClient.users.show.mockResolvedValue(mockUserResponse);

      const result = await service.getUser(1001);

      expect(mockClient.users.show).toHaveBeenCalledWith(1001);
      expect(result).toEqual(mockUser);
    });

    test('キャッシュされたユーザー情報を返す', async () => {
      const mockUserResponse = {
        user: mockUser
      };
      mockClient.users.show.mockResolvedValue(mockUserResponse);

      // 最初の呼び出し
      await service.getUser(1001);
      // 2回目の呼び出し
      const result = await service.getUser(1001);

      expect(mockClient.users.show).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    test('APIエラーの場合はダミーユーザーを返す', async () => {
      mockClient.users.show.mockRejectedValue(new Error('API Error'));

      const result = await service.getUser(1001);

      expect(result.id).toBe(1001);
      expect(result.name).toBe('User 1001');
      expect(result.email).toBe('unknown@example.com');
      expect(result.role).toBe('end-user');
      expect(result.verified).toBe(false);
      expect(result.active).toBe(true);
    });
  });

  describe('testConnection', () => {
    test('接続が成功する場合はtrueを返す', async () => {
      mockClient.users.me.mockResolvedValue({ user: mockUser });

      const result = await service.testConnection();

      expect(mockClient.users.me).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('接続が失敗する場合はfalseを返す', async () => {
      mockClient.users.me.mockRejectedValue(new Error('Connection Error'));

      const result = await service.testConnection();

      expect(result).toBe(false);
    });
  });
});