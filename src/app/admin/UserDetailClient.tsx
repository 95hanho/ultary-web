'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageLoadError } from '@/components/common/PageLoadError';
import { Profile } from '@/components/my-ultary/Profile';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { nicknameTag } from '@/lib/nickname-tag';
import type { BffEnvelope } from '@/types/api';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { REPORT_REASON, REPORT_STATUS, formatWhen } from './adminData';
import { USER_STATUS, type AdminUserDetail } from './adminManagementData';
import UserStatusControl from './UserStatusControl';
import { adminProfileUrl } from './adminProfileUrl';
import styles from './admin.module.scss';

export default function UserDetailClient({ userNo }: { userNo: number }) {
  const [refresh, setRefresh] = useState(0);
  const [loaded, setLoaded] = useState<{
    key: string;
    data?: AdminUserDetail;
    error?: { value: unknown };
  } | null>(null);
  const key = `${userNo}:${refresh}`;
  useEffect(() => {
    let cancelled = false;
    bffGet<BffEnvelope<AdminUserDetail>>(bffEndpoints.admin.user, { userNo })
      .then((res) => {
        if (!res.data) throw new Error('회원 정보가 없습니다.');
        if (!cancelled) setLoaded({ key, data: res.data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoaded({ key, error: { value: error } });
      });
    return () => {
      cancelled = true;
    };
  }, [userNo, key]);
  const current = loaded?.key === key ? loaded : null;
  const detail = current?.data;
  const user = detail?.user;
  return (
    <section className={styles.detail}>
      <div className={styles.detailScroll}>
        <Link className={styles.memberLink} href="/admin/users">
          ← 회원 목록
        </Link>
        <h1 className={styles.detailHash}>회원 상세 {user ? nicknameTag(user.nickname) : ''}</h1>
        {!current ? <p role="status">불러오는 중</p> : null}
        {current?.error ? <PageLoadError error={current.error.value} /> : null}
        {user && detail ? (
          <>
            <div className={styles.userDetailHeader}>
              <Profile
                size={64}
                story="none"
                imageUrl={adminProfileUrl(userNo, user.profileFile) || NO_PROFILE_SRC}
              />
              <div>
                <strong>{nicknameTag(user.nickname)}</strong>
                <p>
                  회원번호 {user.userNo} · {USER_STATUS[user.status]}
                </p>
              </div>
              <UserStatusControl user={user} onChange={() => setRefresh((n) => n + 1)} />
            </div>
            <table className={styles.aiSummaryTable}>
              <caption>기본 정보</caption>
              <tbody>
                <tr>
                  <th scope="row">이름</th>
                  <td>{user.name || '–'}</td>
                </tr>
                <tr>
                  <th scope="row">이메일 · 연락처</th>
                  <td>
                    {user.maskedEmail || '–'} / {user.maskedPhone || '–'}
                  </td>
                </tr>
                <tr>
                  <th scope="row">가입일</th>
                  <td>{formatWhen(user.createdAt)}</td>
                </tr>
                <tr>
                  <th scope="row">정지일 · 탈퇴일</th>
                  <td>
                    {user.suspendedAt ? formatWhen(user.suspendedAt) : '–'} /{' '}
                    {user.withdrawalCompletedAt ? formatWhen(user.withdrawalCompletedAt) : '–'}
                  </td>
                </tr>
                <tr>
                  <th scope="row">SNS 연결</th>
                  <td>
                    Google {user.googleLinked ? '연동' : '미연동'} / Kakao{' '}
                    {user.kakaoLinked ? '연동' : '미연동'}
                  </td>
                </tr>
                <tr>
                  <th scope="row">활동</th>
                  <td>
                    펫 {user.petCount} · 게시글 {user.feedCount} · 받은 신고 {user.reportCount}
                  </td>
                </tr>
              </tbody>
            </table>
            <h2 className={styles.memberSectionTitle}>등록 펫</h2>
            <ul className={styles.adminPetList}>
              {detail.pets.map((pet) => (
                <li key={pet.petId}>
                  <Profile
                    size={45}
                    story="none"
                    imageUrl={adminProfileUrl(userNo, pet.profileFile) || NO_PROFILE_SRC}
                  />
                  <div>
                    <strong>{pet.name}</strong>
                    <p>
                      {pet.species} · {pet.breed || '품종 미등록'} ·{' '}
                      {pet.gender === 'MALE'
                        ? '남아'
                        : pet.gender === 'FEMALE'
                          ? '여아'
                          : '성별 미등록'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {!detail.pets.length ? <p>등록된 펫이 없습니다.</p> : null}
            <h2 className={styles.memberSectionTitle}>최근 게시글 (최대 20개)</h2>
            <div className={styles.memberTableScroll}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>내용</th>
                    <th>공개 범위</th>
                    <th>상태</th>
                    <th>작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.feeds.map((feed) => (
                    <tr key={feed.feedId}>
                      <td>{feed.feedId}</td>
                      <td>{feed.content || '내용 없음'}</td>
                      <td>
                        {{ PUBLIC: '전체', NEIGHBORS: '팔로우', PRIVATE: '나만' }[
                          feed.visibility
                        ] ?? feed.visibility}
                      </td>
                      <td>{feed.deleted ? '삭제/숨김' : '게시 중'}</td>
                      <td>{formatWhen(feed.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!detail.feeds.length ? <p>게시글이 없습니다.</p> : null}
            <h2 className={styles.memberSectionTitle}>최근 받은 신고 (최대 20개)</h2>
            <div className={styles.memberTableScroll}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>신고번호</th>
                    <th>대상</th>
                    <th>사유</th>
                    <th>상태</th>
                    <th>신고일</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.reports.map((report) => (
                    <tr key={report.reportId}>
                      <td>
                        <Link
                          className={styles.memberLink}
                          href={`/admin/reports/${report.reportId}`}
                        >
                          {report.reportId}
                        </Link>
                      </td>
                      <td>
                        {{ USER: '회원', FEED: '게시글', COMMENT: '댓글', REPLY: '답글' }[
                          report.targetType
                        ] ?? report.targetType}
                      </td>
                      <td>{REPORT_REASON[report.reason] ?? report.reason}</td>
                      <td>{REPORT_STATUS[report.status] ?? report.status}</td>
                      <td>{formatWhen(report.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!detail.reports.length ? <p>받은 신고가 없습니다.</p> : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
