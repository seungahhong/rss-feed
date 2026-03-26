import * as path from 'path';
import { FeedStore } from './feed-store';
import { ArticleStore } from './article-store';
import { SummaryStore } from './summary-store';
import { SettingsStore } from './settings-store';
import { TopicStore } from './topic-store';

const DATA_DIR = path.join(process.cwd(), 'data');

export const feedStore = new FeedStore(path.join(DATA_DIR, 'feeds.json'));
export const articleStore = new ArticleStore(path.join(DATA_DIR, 'articles.json'));
export const summaryStore = new SummaryStore(path.join(DATA_DIR, 'summaries.json'));
export const settingsStore = new SettingsStore(path.join(DATA_DIR, 'settings.json'));
export const topicStore = new TopicStore(path.join(DATA_DIR, 'topics.json'));

export { FeedStore } from './feed-store';
export { ArticleStore } from './article-store';
export { SummaryStore } from './summary-store';
export { SettingsStore } from './settings-store';
export { TopicStore } from './topic-store';
export { BaseStore } from './base-store';
