'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { PageLoadError } from '@/components/common/PageLoadError';
import { Profile } from '@/components/my-ultary/Profile';
import { adminProfileUrl } from './adminProfileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { bffEndpoints } from '@/lib/api/endpoints';
import { nicknameTag } from '@/lib/nickname-tag';
import { Pager, useFitCount } from './adminListUi';
import { formatWhen } from './adminData';
import { USER_STATUS, type AdminUser } from './adminManagementData';
import { useAdminPage } from './useAdminPage';
import UserStatusControl from './UserStatusControl';
import styles from './admin.module.scss';

export default function UserListClient() {
  const list = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState({ q: '', status: 'ALL', page: 0 });
  const [count, setCount] = useState(0);
  const size = useFitCount(list, count);
  const [fit, setFit] = useState(size);
  if (fit !== size) {
    setFit(size);
    setFilter((f) => ({ ...f, page: 0 }));
  }
  const { data, error, loading, reload } = useAdminPage<AdminUser>(bffEndpoints.admin.users, {
    ...filter,
    size,
  });
  if (data && count !== data.items.length) setCount(data.items.length);
  return (
    <section className={styles.paneFull}>
      <h1 className={styles.paneTitle}>회원 관리</h1>
      <form
        className={styles.aiFilters}
        onSubmit={(e) => {
          e.preventDefault();
          setFilter((f) => ({ ...f, q: q.trim(), page: 0 }));
        }}
      >
        <label>
          닉네임태그 · 반려동물 이름 · 회원번호
          <input
            className={styles.memberSearch}
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            placeholder="닉네임태그, 반려동물 이름, 회원번호"
          />
        </label>
        <label>
          회원 상태
          <select
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value, page: 0 }))}
          >
            <option value="ALL">전체</option>
            {Object.entries(USER_STATUS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={styles.pageButton}>
          검색
        </button>
      </form>
      {error ? <PageLoadError error={error.value} /> : null}
      <div ref={list} className={`${styles.listWrap} ${styles.tableWrap}`} aria-busy={loading}>
        <table className={styles.dataTable}>
          <caption className={styles.tableCaption}>회원 목록</caption>
          <colgroup>
            <col className={styles.numberColumn} />
            <col className={styles.imageColumn} />
            <col />
            <col className={styles.petNamesColumn} />
            <col className={styles.memberColumn} />
            <col className={styles.dateColumn} />
            <col className={styles.memberColumn} />
            <col className={styles.memberColumn} />
            <col className={styles.memberColumn} />
            <col className={styles.userActionColumn} />
          </colgroup>
          <thead>
            <tr>
              {[
                '회원번호',
                '프로필',
                '닉네임태그',
                '반려동물',
                '상태',
                '가입일',
                '펫 수',
                '게시글 수',
                '받은 신고',
                '상태 변경',
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((user) => (
              <tr
                key={user.userNo}
                className={
                  user.status === 'SUSPENDED'
                    ? styles.tagRejected
                    : user.status === 'WITHDRAWN'
                      ? styles.settled
                      : undefined
                }
              >
                <td>{user.userNo}</td>
                <td>
                  <Link
                    href={`/admin/users/${user.userNo}`}
                    aria-label={`${nicknameTag(user.nickname)} 회원 상세`}
                  >
                    <Profile
                      size={45}
                      story="none"
                      imageUrl={adminProfileUrl(user.userNo, user.profileFile) || NO_PROFILE_SRC}
                    />
                  </Link>
                </td>
                <td>
                  <Link className={styles.memberLink} href={`/admin/users/${user.userNo}`}>
                    {nicknameTag(user.nickname)}
                  </Link>
                </td>
                <td>{user.petNames?.join(', ') || '–'}</td>
                <td>{USER_STATUS[user.status] ?? user.status}</td>
                <td className={styles.tableDate}>{formatWhen(user.createdAt)}</td>
                <td>{user.petCount}</td>
                <td>{user.feedCount}</td>
                <td>{user.reportCount}</td>
                <td>
                  <UserStatusControl user={user} onChange={reload} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? (
          <p className={styles.empty}>불러오는 중</p>
        ) : !error && !data?.items.length ? (
          <p className={styles.empty}>조건에 맞는 회원이 없습니다.</p>
        ) : null}
      </div>
      <Pager
        page={filter.page}
        pageSize={size}
        totalCount={data?.totalCount ?? null}
        disabled={loading}
        hasNext={!!data && (filter.page + 1) * size < data.totalCount}
        onPrev={() => setFilter((f) => ({ ...f, page: Math.max(0, f.page - 1) }))}
        onNext={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
      />
    </section>
  );
}
