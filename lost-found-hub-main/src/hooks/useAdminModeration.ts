import { useSyncExternalStore } from 'react';
import { mockPosts, mockReports } from '@/data/mockData';

// Shared moderation state for the prototype admin screens.
let suspendedPostIds = new Set(mockPosts.filter(post => post.status === 'suspended').map(post => post.id));
let resolvedReportIds = new Set(mockReports.filter(report => report.status !== 'pending').map(report => report.id));
let reasons: Record<string, string> = Object.fromEntries(mockPosts.filter(post => post.status === 'suspended').map(post => [post.id, mockReports.find(report => report.postId === post.id)?.reason ?? post.description.replace(/^โพสต์ถูกระงับเนื่องจาก/, '')]));
let snapshot = { suspendedPostIds, resolvedReportIds, reasons };
const listeners = new Set<() => void>();

export const useAdminModeration = () => useSyncExternalStore(
  listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  () => snapshot,
);

export const resolveReport = (reportId: string, postId: string, suspend: boolean, reason: string) => {
  resolvedReportIds = new Set([...resolvedReportIds, reportId]);
  if (suspend) {
    suspendedPostIds = new Set([...suspendedPostIds, postId]);
    reasons = { ...reasons, [postId]: reason };
  }
  snapshot = { suspendedPostIds, resolvedReportIds, reasons };
  listeners.forEach(listener => listener());
};

export const suspendAdminPost = (postId: string) => {
  suspendedPostIds = new Set([...suspendedPostIds, postId]);
  reasons = { ...reasons, [postId]: 'ระงับโดยผู้ดูแลระบบ' };
  snapshot = { suspendedPostIds, resolvedReportIds, reasons };
  listeners.forEach(listener => listener());
};