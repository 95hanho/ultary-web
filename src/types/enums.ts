/** ultary_user.withdrawal_status */
export type WithdrawalStatus = 'ACTIVE' | 'REQUESTED' | 'WITHDRAWN';

/** ultary_admin.role */
export type AdminRole = 'SUPER' | 'OPERATOR';

/** ultary_admin.status */
export type AdminStatus = 'ACTIVE' | 'SUSPENDED';

/** ultary_token.owner_type */
export type TokenOwnerType = 'USER' | 'ADMIN';

/** ultary_pet.species */
export type PetSpecies = 'DOG' | 'CAT' | 'ETC';

/** ultary_pet.gender */
export type PetGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

/** ultary_neighbor.status */
export type NeighborStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

/** ultary_feed.visibility */
export type FeedVisibility = 'PUBLIC' | 'NEIGHBORS' | 'PRIVATE';

/** ultary_feed_pet.status */
export type FeedPetStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

/** ultary_notification.type */
export type NotificationType =
  | 'FEED_LIKE'
  | 'FEED_COMMENT'
  | 'FEED_REPLY'
  | 'MENTION'
  | 'NEIGHBOR_REQUEST'
  | 'NEIGHBOR_ACCEPTED'
  | 'PET_TAG_REQUEST'
  | 'PET_TAG_APPROVED'
  | 'SYSTEM';

/** ultary_report.target_type */
export type ReportTargetType = 'USER' | 'PET' | 'FEED' | 'COMMENT' | 'REPLY';

/** ultary_report.status */
export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';

/** ultary_ai_request_log.feature_type */
export type AiFeatureType =
  | 'FEED_CAPTION'
  | 'HASHTAG'
  | 'PET_PROFILE'
  | 'COMMENT_FILTER'
  | 'ALT_TEXT';

/** ultary_ai_request_log.status */
export type AiRequestStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
