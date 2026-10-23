import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { REPORT_STATUS, type ReportItem } from './adminData';
const CONTENT_TYPE = new Set(['FEED', 'COMMENT', 'REPLY']);
export const ACTION_URL: Record<string, string> = {
  CONFIRMED: bffEndpoints.admin.reportConfirm,
  REJECTED: bffEndpoints.admin.reportReject,
  DELETED: bffEndpoints.admin.reportDeleteContent,
  SUSPENDED: bffEndpoints.admin.reportSuspend,
};

export function actionOptions(item: ReportItem, shown: string) {
  const values = ['CONFIRMED', 'REJECTED'];
  if (item.targetType === 'USER') values.push('SUSPENDED');
  else if (CONTENT_TYPE.has(item.targetType)) values.push('DELETED');
  if (item.status === 'REQUESTED') values.unshift('REQUESTED');
  else if (item.status && !values.includes(item.status)) values.unshift(item.status);
  if (shown && !values.includes(shown)) values.unshift(shown);
  return values.map(statusOption);
}

function statusOption(value: string) {
  return { value, label: REPORT_STATUS[value] ?? value };
}

export function mergeReport(current: ReportItem, raw: unknown, status: string): ReportItem {
  const source = isRecord(raw) ? raw : null;
  const nextStatus = source && typeof source.status === 'string' ? source.status : status;
  return {
    ...current,
    status: nextStatus,
    processedAt:
      source && typeof source.processedAt === 'string' ? source.processedAt : current.processedAt,
    targetSuspended: suspendedOf(source, nextStatus, current),
  };
}

function suspendedOf(
  source: Record<string, unknown> | null,
  nextStatus: string,
  current: ReportItem,
) {
  if (source && typeof source.targetSuspended === 'boolean') return source.targetSuspended;
  if (nextStatus === 'SUSPENDED') return true;
  if (current.status === 'SUSPENDED') return false;
  return current.targetSuspended;
}

export function actionError(err: unknown) {
  const code = errorCode(err);
  if (code === 'REPORT_NOT_FOUND') return '신고를 찾지 못했습니다.';
  if (code === 'REPORT_ALREADY_CLOSED') return '이미 처리된 신고입니다.';
  if (code === 'REPORT_ACTION_MISMATCH') return '이 신고에는 할 수 없는 처리입니다.';
  if (isHttpError(err) && err.message.trim()) return err.message;
  return '처리하지 못했습니다.';
}

function errorCode(err: unknown) {
  if (!isHttpError(err)) return '';
  if (isRecord(err.data)) {
    if (typeof err.data.code === 'string') return err.data.code;
    if (isRecord(err.data.data) && typeof err.data.data.code === 'string')
      return err.data.data.code;
  }
  return err.message;
}
