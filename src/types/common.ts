/** API JSON의 DATETIME — ISO 8601 문자열 */
export type DateTimeString = string;

/** MariaDB TINYINT(1) */
export type Flag = boolean;

export type SoftDelete = {
  isDeleted: Flag;
  deletedAt: DateTimeString | null;
};

export type Timestamps = {
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
};
