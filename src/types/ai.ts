import type { DateTimeString } from './common';
import type { AiFeatureType, AiRequestStatus } from './enums';

/** ultary_ai_request_log */
export type AiRequestLog = {
  aiRequestId: number;
  userNo: number;
  featureType: AiFeatureType;
  targetFeedId: number | null;
  targetPetId: number | null;
  prompt: string | null;
  result: string | null;
  modelName: string | null;
  usedTokenCount: number | null;
  status: AiRequestStatus;
  errorMessage: string | null;
  createdAt: DateTimeString;
};
