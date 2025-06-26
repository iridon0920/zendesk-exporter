// Zendesk チケット関連の型定義
export interface ZendeskTicket {
  id: number;
  url: string;
  external_id: string | null;
  via: {
    channel: string;
    source: any;
  };
  created_at: string;
  updated_at: string;
  type: string | null;
  subject: string;
  raw_subject: string;
  description: string;
  priority: string | null;
  status: string;
  recipient: string | null;
  requester_id: number;
  submitter_id: number;
  assignee_id: number | null;
  organization_id: number | null;
  group_id: number | null;
  collaborator_ids: number[];
  follower_ids: number[];
  email_cc_ids: number[];
  forum_topic_id: number | null;
  problem_id: number | null;
  has_incidents: boolean;
  is_public: boolean;
  due_at: string | null;
  tags: string[];
  custom_fields: CustomField[];
  satisfaction_rating: any | null;
  sharing_agreement_ids: number[];
  fields: CustomField[];
  followup_ids: number[];
  brand_id: number;
  allow_channelback: boolean;
  allow_attachments: boolean;
}

export interface CustomField {
  id: number;
  value: any;
}

// コメント関連の型定義
export interface ZendeskComment {
  id: number;
  type: string;
  author_id: number;
  body: string;
  html_body: string;
  plain_body: string;
  public: boolean;
  attachments: ZendeskAttachment[];
  audit_id: number;
  via: {
    channel: string;
    source: any;
  };
  created_at: string;
  metadata: any;
}

export interface ZendeskAttachment {
  id: number;
  url: string;
  file_name: string;
  content_url: string;
  content_type: string;
  size: number;
  width?: number;
  height?: number;
  inline?: boolean;
  deleted?: boolean;
  malware_access_override?: boolean;
  malware_scan_result?: string;
  thumbnails?: Array<{
    id: number;
    url: string;
    file_name: string;
    content_url: string;
    content_type: string;
    size: number;
    width: number;
    height: number;
    inline: boolean;
  }>;
}

// ユーザー関連の型定義
export interface ZendeskUser {
  id: number;
  url: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  time_zone: string;
  iana_time_zone: string;
  phone: string | null;
  shared_phone_number: string | null;
  photo: any | null;
  locale_id: number;
  locale: string;
  organization_id: number | null;
  role: string;
  verified: boolean;
  external_id: string | null;
  tags: string[];
  alias: string | null;
  active: boolean;
  shared: boolean;
  shared_agent: boolean;
  last_login_at: string | null;
  two_factor_auth_enabled: boolean;
  signature: string | null;
  details: string | null;
  notes: string | null;
  role_type: number | null;
  custom_role_id: number | null;
  moderator: boolean;
  ticket_restriction: string | null;
  only_private_comments: boolean;
  restricted_agent: boolean;
  suspended: boolean;
  default_group_id: number | null;
  report_csv: boolean;
  user_fields: any;
}

// 設定関連の型定義
export interface ZendeskConfig {
  subdomain: string;
  email: string;
  token: string;
}

export interface ExportOptions {
  tags?: string[];
  form?: string;
  output: string;
}

// フィルター関連の型定義
export interface TicketFilter {
  tags?: string[];
  formId?: string;
  status?: string[];
}

// 出力関連の型定義
export interface MarkdownTicket {
  id: number;
  subject: string;
  status: string;
  priority: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  requesterName: string;
  assigneeName?: string;
  tags: string[];
  description: string;
  comments: MarkdownComment[];
  customFields: CustomField[];
}

export interface MarkdownComment {
  id: number;
  authorName: string;
  body: string;
  isPublic: boolean;
  createdAt: string;
  attachments: ZendeskAttachment[];
}