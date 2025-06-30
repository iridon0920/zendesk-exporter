import { ZendeskClient, Ticket, User, SearchOptions } from 'zendesk-api-client-typescript';
import type { Comment } from 'zendesk-api-client-typescript/dist/types/ticket';
import { 
  ZendeskConfig, 
  ZendeskTicket, 
  ZendeskComment, 
  ZendeskUser, 
  TicketFilter,
  MarkdownTicket,
  MarkdownComment
} from '../types';

export class ZendeskService {
  private client: ZendeskClient;
  private usersCache: Map<number, User> = new Map();

  constructor(config: ZendeskConfig) {
    this.client = new ZendeskClient({
      subdomain: config.subdomain,
      email: config.email,
      token: config.token,
    });
  }

  // チケット一覧を取得（フィルタ付き）
  async getTicketsWithFilter(filter: TicketFilter): Promise<Ticket[]> {
    let searchQuery = '';
    const queryParts: string[] = [];

    // タグでフィルタ
    if (filter.tags && filter.tags.length > 0) {
      const tagQuery = filter.tags.map(tag => `tags:${tag}`).join(' ');
      queryParts.push(tagQuery);
    }

    // フォームIDでフィルタ
    if (filter.formId) {
      queryParts.push(`ticket_form_id:${filter.formId}`);
    }

    // ステータスでフィルタ（デフォルトは全て）
    if (filter.status && filter.status.length > 0) {
      const statusQuery = filter.status.map(status => `status:${status}`).join(' OR ');
      queryParts.push(`(${statusQuery})`);
    }

    searchQuery = queryParts.join(' AND ');

    try {
      let tickets: Ticket[] = [];
      
      if (searchQuery) {
        // 検索クエリがある場合は検索APIを使用
        const searchOptions: SearchOptions = { query: searchQuery };
        const searchResults = await this.client.search.searchTickets(searchOptions);
        tickets = searchResults.results;
      } else {
        // フィルタがない場合は全チケットを取得
        const response = await this.client.tickets.list();
        tickets = response.tickets;
      }

      return tickets;
    } catch (error) {
      console.error('チケット取得エラー:', error);
      throw new Error(`チケットの取得に失敗しました: ${error}`);
    }
  }

  // 特定のチケットのコメントを取得
  async getTicketComments(ticketId: number): Promise<Comment[]> {
    try {
      const response = await this.client.tickets.listComments(ticketId, {
        sort_order: 'asc' // 時系列順にソート
      });
      return response.comments;
    } catch (error) {
      console.error(`チケット ${ticketId} のコメント取得エラー:`, error);
      throw new Error(`チケット${ticketId}のコメント取得に失敗しました: ${error}`);
    }
  }

  // ユーザー情報を取得（キャッシュ付き）
  async getUser(userId: number): Promise<User> {
    if (this.usersCache.has(userId)) {
      return this.usersCache.get(userId)!;
    }

    try {
      const response = await this.client.users.show(userId);
      this.usersCache.set(userId, response.user);
      return response.user;
    } catch (error) {
      console.error(`ユーザー ${userId} の取得エラー:`, error);
      // エラーの場合はダミーユーザーを返す
      const dummyUser: User = {
        id: userId,
        url: `https://example.zendesk.com/api/v2/users/${userId}.json`,
        name: `User ${userId}`,
        email: 'unknown@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'end-user',
        verified: false,
        active: true
      };
      this.usersCache.set(userId, dummyUser);
      return dummyUser;
    }
  }

  // チケットをMarkdown形式のデータに変換
  async convertTicketToMarkdown(ticket: Ticket): Promise<MarkdownTicket> {
    // 関連するユーザー情報を取得
    const [requester, assignee] = await Promise.all([
      this.getUser(ticket.requester_id),
      ticket.assignee_id ? this.getUser(ticket.assignee_id) : null
    ]);

    // コメントを取得
    const comments = await this.getTicketComments(ticket.id);
    
    // コメントをMarkdown形式に変換
    const markdownComments: MarkdownComment[] = [];
    for (const comment of comments) {
      const author = await this.getUser(comment.author_id);
      
      // 役割を判定
      let authorRole: 'requester' | 'agent' | 'collaborator';
      if (comment.author_id === ticket.requester_id) {
        authorRole = 'requester';
      } else if (author.role === 'admin' || author.role === 'agent') {
        authorRole = 'agent';
      } else {
        authorRole = 'collaborator';
      }
      
      markdownComments.push({
        id: comment.id,
        authorName: author.name,
        authorRole,
        body: comment.plain_body || comment.body,
        isPublic: comment.public,
        createdAt: comment.created_at,
        attachments: comment.attachments || []
      });
    }

    return {
      id: ticket.id,
      subject: ticket.subject || '',
      status: ticket.status,
      priority: ticket.priority || null,
      type: ticket.type || null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      requesterName: requester.name,
      assigneeName: assignee?.name,
      tags: ticket.tags || [],
      description: ticket.description || '',
      comments: markdownComments,
      customFields: ticket.custom_fields || []
    };
  }

  // 複数のチケットを一括でMarkdown形式に変換
  async convertTicketsToMarkdown(tickets: Ticket[]): Promise<MarkdownTicket[]> {
    const markdownTickets: MarkdownTicket[] = [];
    const totalTickets = tickets.length;
    
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      try {
        process.stdout.write(`\rチケット処理中... (${i + 1}/${totalTickets}件処理完了)`);
        const markdownTicket = await this.convertTicketToMarkdown(ticket);
        markdownTickets.push(markdownTicket);
        
        // API レート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`チケット ${ticket.id} の変換エラー:`, error);
        // エラーが発生しても他のチケットの処理は続行
      }
    }

    // 処理完了後に改行を追加
    if (totalTickets > 0) {
      console.log(''); // 改行
    }

    return markdownTickets;
  }

  // 接続テスト
  async testConnection(): Promise<boolean> {
    try {
      await this.client.users.me();
      return true;
    } catch (error) {
      console.error('Zendesk接続テストエラー:', error);
      return false;
    }
  }
}