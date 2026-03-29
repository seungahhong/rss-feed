import { FeedStore } from './feed-store';
import { ArticleStore } from './article-store';
import { SummaryStore } from './summary-store';
import { SettingsStore } from './settings-store';
import { TopicStore } from './topic-store';

export const feedStore = new FeedStore();
export const articleStore = new ArticleStore();
export const summaryStore = new SummaryStore();
export const settingsStore = new SettingsStore();
export const topicStore = new TopicStore();

export { FeedStore } from './feed-store';
export { ArticleStore } from './article-store';
export { SummaryStore } from './summary-store';
export { SettingsStore } from './settings-store';
export { TopicStore } from './topic-store';
