import { bffEndpoints } from '@/lib/api/endpoints';
import { bffDelete, bffPostJson } from '@/lib/api/bffFetch';
import { isHttpError, isRecord } from '@/lib/api/error';
import { showFooterNotice } from '@/lib/ui/footerNotice';
import { useModalStore } from '@/stores/modal.store';

export type ReportTargetType = 'USER' | 'FEED' | 'COMMENT' | 'REPLY';

/** 내가 넣은 신고. 없으면 null */
export type MyReport = {
  reportId: number;
  status: string;
};

export function readMyReport(raw: unknown): MyReport | null {
  if (!isRecord(raw) || !isRecord(raw.myReport)) return null;
  const reportId = raw.myReport.reportId;
  const status = raw.myReport.status;
  if (typeof reportId !== 'number' || typeof status !== 'string' || !status) return null;
  return { reportId, status };
}

/** 신고요청만 취소할 수 있다 */
export function canCancelReport(
  report: MyReport | null | undefined,
): report is MyReport {
  return report?.status === 'REQUESTED';
}

export type ReportReason =
  | 'SPAM'
  | 'ABUSE'
  | 'HARASSMENT'
  | 'SEXUAL'
  | 'VIOLENCE'
  | 'HATE'
  | 'IMPERSONATION'
  | 'PRIVACY'
  | 'OTHER';

const REPORT_REASONS: { code: ReportReason; label: string }[] = [
  { code: 'SPAM', label: '스팸·광고' },
  { code: 'ABUSE', label: '욕설·비방' },
  { code: 'HARASSMENT', label: '괴롭힘' },
  { code: 'SEXUAL', label: '음란' },
  { code: 'VIOLENCE', label: '폭력' },
  { code: 'HATE', label: '혐오' },
  { code: 'IMPERSONATION', label: '사칭' },
  { code: 'PRIVACY', label: '개인정보' },
  { code: 'OTHER', label: '기타' },
];

function reportErrorMessage(err: unknown) {
  const data = isHttpError(err) ? err.data : null;
  const code = isRecord(data) && typeof data.code === 'string' ? data.code : '';
  if (code === 'REPORT_ALREADY_OPENED' || (isHttpError(err) && err.status === 409)) {
    return '이미 접수된 신고가 있습니다.';
  }
  return '신고를 접수하지 못했습니다.';
}

function createdReport(raw: unknown): MyReport | null {
  if (!isRecord(raw)) return null;
  const data = isRecord(raw.data) ? raw.data : raw;
  if (typeof data.reportId !== 'number') return null;
  const status = typeof data.status === 'string' && data.status ? data.status : 'REQUESTED';
  return { reportId: data.reportId, status };
}

async function submitReport(
  targetType: ReportTargetType,
  targetId: number,
  reason: ReportReason,
  onCreated?: (report: MyReport) => void,
) {
  const openModal = useModalStore.getState().open;
  try {
    const res = await bffPostJson<unknown>(bffEndpoints.users.report, {
      targetType,
      targetId,
      reason,
    });
    const created = createdReport(res);
    if (created) onCreated?.(created);
    showFooterNotice('신고가 접수되었습니다.');
  } catch (err) {
    console.error('[report] create failed', err);
    openModal({
      variant: 'alert',
      title: '알림창',
      content: reportErrorMessage(err),
      showCloseButton: true,
    });
  }
}

/** 울타리 + 메뉴와 같은 버튼 목록. 딤을 누르면 닫히고, 사유를 고르면 신고한다. */
export function openReportModal(
  target: { targetType: ReportTargetType; targetId: number },
  onCreated?: (report: MyReport) => void,
) {
  useModalStore.getState().open({
    variant: 'action',
    closeOnDimClick: true,
    items: REPORT_REASONS.map((reason) => ({
      label: reason.label,
      onClick: () => {
        void submitReport(target.targetType, target.targetId, reason.code, onCreated);
      },
    })),
  });
}

export async function cancelReport(reportId: number) {
  try {
    await bffDelete(bffEndpoints.users.reportCancel, { reportId });
    showFooterNotice('신고가 취소되었습니다.');
  } catch (err) {
    console.error('[report] cancel failed', err);
    useModalStore.getState().open({
      variant: 'alert',
      title: '알림창',
      content: '신고를 취소하지 못했습니다.',
      showCloseButton: true,
    });
    throw err;
  }
}
