import { promises as fs } from 'fs';
import { MarkdownTicket } from '../types';

// Markdown出力用のユーティリティ関数
export class MarkdownExporter {
  // 単一チケットをMarkdown形式に変換
  static formatTicket(ticket: MarkdownTicket): string {
    const lines: string[] = [];
    
    // フロントマター
    lines.push('---');
    lines.push(`id: ${ticket.id}`);
    lines.push(`subject: "${ticket.subject}"`);
    lines.push(`status: ${ticket.status}`);
    lines.push(`priority: ${ticket.priority || 'N/A'}`);
    lines.push(`type: ${ticket.type || 'N/A'}`);
    lines.push(`created_at: ${ticket.createdAt}`);
    lines.push(`updated_at: ${ticket.updatedAt}`);
    lines.push(`requester: "${ticket.requesterName}"`);
    if (ticket.assigneeName) {
      lines.push(`assignee: "${ticket.assigneeName}"`);
    }
    if (ticket.tags.length > 0) {
      lines.push(`tags: [${ticket.tags.map(tag => `"${tag}"`).join(', ')}]`);
    }
    lines.push('---');
    lines.push('');
    
    // チケットのヘッダー
    lines.push(`# チケット #${ticket.id}: ${ticket.subject}`);
    lines.push('');
    
    // 基本情報テーブル
    lines.push('## 基本情報');
    lines.push('');
    lines.push('| 項目 | 値 |');
    lines.push('|------|-----|');
    lines.push(`| チケットID | ${ticket.id} |`);
    lines.push(`| ステータス | ${ticket.status} |`);
    lines.push(`| 優先度 | ${ticket.priority || 'N/A'} |`);
    lines.push(`| タイプ | ${ticket.type || 'N/A'} |`);
    lines.push(`| 作成日時 | ${this.formatDate(ticket.createdAt)} |`);
    lines.push(`| 更新日時 | ${this.formatDate(ticket.updatedAt)} |`);
    lines.push(`| 作成者 | ${ticket.requesterName} |`);
    if (ticket.assigneeName) {
      lines.push(`| 担当者 | ${ticket.assigneeName} |`);
    }
    if (ticket.tags.length > 0) {
      lines.push(`| タグ | ${ticket.tags.join(', ')} |`);
    }
    lines.push('');
    
    // 説明
    lines.push('## 説明');
    lines.push('');
    lines.push(this.formatContent(ticket.description));
    lines.push('');
    
    // カスタムフィールド（存在する場合）
    if (ticket.customFields && ticket.customFields.length > 0) {
      lines.push('## カスタムフィールド');
      lines.push('');
      for (const field of ticket.customFields) {
        if (field.value) {
          lines.push(`- **フィールド ${field.id}**: ${field.value}`);
        }
      }
      lines.push('');
    }
    
    // コメント履歴
    if (ticket.comments.length > 0) {
      lines.push('## コメント履歴');
      lines.push('');
      
      // コメントを時系列順にソート
      const sortedComments = [...ticket.comments].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      for (const comment of sortedComments) {
        const roleText = comment.authorRole === 'requester' ? '(リクエスタ)' : 
                        comment.authorRole === 'agent' ? '(エージェント)' : 
                        '(コラボレーター)';
        lines.push(`### ${comment.authorName}${roleText} - ${this.formatDate(comment.createdAt)}`);
        lines.push('');
        if (!comment.isPublic) {
          lines.push('**[社内メモ]**');
          lines.push('');
        }
        lines.push(this.formatContent(comment.body));
        
        // 添付ファイル
        if (comment.attachments && comment.attachments.length > 0) {
          lines.push('');
          lines.push('**添付ファイル:**');
          for (const attachment of comment.attachments) {
            lines.push(`- [${attachment.file_name}](${attachment.content_url}) (${this.formatFileSize(attachment.size)})`);
          }
        }
        
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }
    
    return lines.join('\n');
  }
  
  // 複数チケットをMarkdown形式に変換
  static formatTickets(tickets: MarkdownTicket[]): string {
    const lines: string[] = [];
    
    // ドキュメントヘッダー
    lines.push('# Zendesk チケット エクスポート');
    lines.push('');
    lines.push(`エクスポート日時: ${new Date().toLocaleString('ja-JP')}`);
    lines.push(`チケット数: ${tickets.length}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // 目次
    if (tickets.length > 1) {
      lines.push('## 目次');
      lines.push('');
      for (const ticket of tickets) {
        lines.push(`- [チケット #${ticket.id}: ${ticket.subject}](#チケット-${ticket.id}-${this.slugify(ticket.subject)})`);
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    
    // 各チケットの内容
    for (let i = 0; i < tickets.length; i++) {
      if (i > 0) {
        lines.push('');
        lines.push('---');
        lines.push('');
      }
      lines.push(this.formatTicket(tickets[i]));
    }
    
    return lines.join('\n');
  }
  
  // ファイルに保存
  static async saveToFile(content: string, filePath: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`Markdownファイルを保存しました: ${filePath}`);
    } catch (error) {
      console.error('ファイル保存エラー:', error);
      throw new Error(`ファイルの保存に失敗しました: ${error}`);
    }
  }
  
  // チケットをファイルにエクスポート
  static async exportTickets(tickets: MarkdownTicket[], filePath: string): Promise<void> {
    const content = this.formatTickets(tickets);
    await this.saveToFile(content, filePath);
  }
  
  // ヘルパー関数: 日時フォーマット
  private static formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  }
  
  // ヘルパー関数: コンテンツフォーマット
  private static formatContent(content: string): string {
    if (!content) return '';
    
    // HTMLタグを除去（簡易的）
    const cleanContent = content
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    return cleanContent.trim();
  }
  
  // ヘルパー関数: ファイルサイズフォーマット
  private static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  // ヘルパー関数: スラッグ化（目次リンク用）
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 特殊文字を除去
      .replace(/[\s_-]+/g, '-') // スペースやアンダースコアをハイフンに
      .replace(/^-+|-+$/g, ''); // 前後のハイフンを除去
  }
}