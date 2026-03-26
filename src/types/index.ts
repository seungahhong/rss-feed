// Feed: RSS 피드 소스 정보
export interface Feed {
  id: string;
  url: string;
  name: string;
  category: string;
  active: boolean;
  lastFetchedAt: string | null;
  lastFetchStatus: 'success' | 'error' | null;
  lastEtag: string | null;
  lastModified: string | null;
  createdAt: string;
  snapshotAt: string | null; // 최초 동기화 시점 (이후 동기화에서 이전 발행 글 무시)
}

// Article: RSS에서 수집된 원본 기사
export interface Article {
  id: string;
  feedId: string;
  guid: string;
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  author: string;
  publishedAt: string;
  contentHash: string;
  fetchedAt: string;
  topic: string; // AI 분류 주제 (기본값: 'Uncategorized')
}

// Summary: AI가 생성한 요약
export interface Summary {
  id: string;
  articleId: string;
  lang: SupportedLocale;
  title: string;
  description: string;
  generatedAt: string;
  model: string;
  status: SummaryStatus;
}

export type SummaryStatus = 'pending' | 'summarizing' | 'summarized' | 'failed';

// Settings: 앱 설정
export type PollingScheduleType = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface PollingConfig {
  enabled: boolean;
  type: PollingScheduleType;
  intervalHours: number; // hourly: 매 N시간
  time: string; // daily/weekly/monthly: "HH:mm"
  dayOfWeek: number; // weekly: 0(월)~6(일)
  dayOfMonth: number; // monthly: 1~31
}

export interface Settings {
  polling: PollingConfig;
  ai: {
    ollamaUrl: string;
    model: string;
  };
  locale: SupportedLocale;
  theme: Theme;
}

export type SupportedLocale = 'ko' | 'en';
export type Theme = 'light' | 'dark' | 'system';

// Topic: AI 분류 주제 카테고리
export interface Topic {
  id: string;
  name: string; // 카테고리명 (영문 키)
  label: {
    ko: string;
    en: string;
  };
  isSeed: boolean; // 시드 카테고리 여부
  createdAt: string;
}

// JSON 파일 저장소 스키마
export interface FeedsData {
  feeds: Feed[];
}

export interface ArticlesData {
  articles: Article[];
}

export interface SummariesData {
  summaries: Summary[];
}

export interface TopicsData {
  topics: Topic[];
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 요약 큐 아이템
export interface SummaryJob {
  articleId: string;
  lang: SupportedLocale;
  status: 'queued' | 'processing' | 'done' | 'failed';
}

// 기본 설정값
export const DEFAULT_SETTINGS: Settings = {
  polling: {
    enabled: true,
    type: 'daily',
    intervalHours: 1,
    time: '07:00',
    dayOfWeek: 0,
    dayOfMonth: 1,
  },
  ai: {
    ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: 'llama3',
  },
  locale: 'ko',
  theme: 'system',
};
