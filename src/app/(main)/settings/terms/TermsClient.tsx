'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import clsx from 'clsx';
import { useState } from 'react';
import styles from './terms.module.scss';

type DocKey = 'terms' | 'privacy';

const TERMS_SECTIONS = [
  {
    title: '제1조 (목적)',
    body: '본 약관은 울타리(이하 “회사”)가 제공하는 반려동물 커뮤니티 서비스(이하 “서비스”)의 이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (정의)',
    body: '“회원”이란 본 약관에 동의하고 서비스에 가입하여 이용하는 자를 말합니다. “콘텐츠”란 회원이 서비스에 게시하는 게시글·스토리·댓글·사진·반려동물 정보 등 일체의 정보를 말합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    body: '회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정 사유를 명시하여 서비스 내에 공지합니다. 변경된 약관에 동의하지 않는 경우 회원은 이용계약을 해지할 수 있습니다.',
  },
  {
    title: '제4조 (회원가입 및 계정 관리)',
    body: '회원은 본인의 정확한 정보를 제공하여 가입해야 하며, 계정 정보 관리 책임은 회원에게 있습니다. 타인의 정보를 도용하거나 허위 정보를 기재한 경우 서비스 이용이 제한될 수 있습니다.',
  },
  {
    title: '제5조 (서비스의 제공 및 변경)',
    body: '회사는 마이울타리, 피드, 스토리, 이웃·주민 관계, 알림 등 서비스를 제공합니다. 운영상·기술상 필요에 따라 서비스 내용을 변경하거나 중단할 수 있으며, 중요한 변경은 사전에 안내합니다.',
  },
  {
    title: '제6조 (회원의 의무)',
    body: '회원은 법령, 본 약관, 서비스 운영정책을 준수해야 합니다. 타인을 비방·차별하거나, 음란·불법 정보, 광고성 스팸, 타인의 권리를 침해하는 콘텐츠를 게시해서는 안 됩니다.',
  },
  {
    title: '제7조 (콘텐츠의 권리와 책임)',
    body: '회원이 작성한 콘텐츠의 저작권은 원칙적으로 회원에게 귀속됩니다. 다만 회사는 서비스 운영·개선·홍보를 위해 필요한 범위에서 콘텐츠를 이용할 수 있습니다. 콘텐츠로 인한 분쟁의 책임은 해당 회원에게 있습니다.',
  },
  {
    title: '제8조 (서비스 이용 제한 및 계약 해지)',
    body: '회원이 약관을 위반하거나 서비스 운영을 방해하는 경우 회사는 경고, 이용 제한, 계약 해지 등의 조치를 할 수 있습니다. 회원은 설정 메뉴를 통해 언제든지 탈퇴를 요청할 수 있습니다.',
  },
  {
    title: '제9조 (면책)',
    body: '천재지변, 통신 장애 등 불가항력으로 서비스를 제공할 수 없는 경우 회사는 책임을 지지 않습니다. 회원 간 또는 회원과 제3자 간 분쟁에 대해서는 회사의 고의 또는 중대한 과실이 없는 한 개입·책임지지 않습니다.',
  },
  {
    title: '제10조 (준거법 및 관할)',
    body: '본 약관은 대한민국 법령에 따르며, 서비스 이용과 관련하여 발생한 분쟁에 대해서는 민사소송법상의 관할 법원에 제소합니다.',
  },
] as const;

const PRIVACY_SECTIONS = [
  {
    title: '1. 개인정보의 수집 항목',
    body: '회원가입 및 서비스 이용 과정에서 이메일, 비밀번호, 이름, 닉네임, 휴대폰 번호, 지역 정보, 프로필·반려동물 사진, 기기 정보, 접속 로그 등을 수집할 수 있습니다.',
  },
  {
    title: '2. 개인정보의 수집·이용 목적',
    body: '회원 식별 및 가입의사 확인, 본인·연락처 인증, 서비스 제공·개선, 맞춤형 콘텐츠 추천, 고객문의 대응, 부정 이용 방지, 공지사항 전달 등을 위해 개인정보를 이용합니다.',
  },
  {
    title: '3. 개인정보의 보유 및 이용 기간',
    body: '원칙적으로 회원 탈퇴 시까지 보유·이용하며, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관 후 파기합니다. 탈퇴 요청 시 지체 없이 개인정보를 삭제합니다. 다만 분쟁 대응 등 정당한 사유가 있는 경우 일정 기간 보관할 수 있습니다.',
  },
  {
    title: '4. 개인정보의 제3자 제공',
    body: '회사는 원칙적으로 회원의 동의 없이 개인정보를 외부에 제공하지 않습니다. 법령에 근거하거나 수사기관의 요청이 있는 등 예외적인 경우에 한해 제공할 수 있습니다.',
  },
  {
    title: '5. 개인정보 처리의 위탁',
    body: '원활한 서비스 제공을 위해 클라우드 호스팅, 문자·이메일 발송, 고객지원 등 일부를 외부에 위탁할 수 있으며, 위탁 시 관련 법령에 따라 안전하게 관리되도록 감독합니다.',
  },
  {
    title: '6. 이용자의 권리',
    body: '회원은 언제든지 자신의 개인정보를 조회·수정·삭제하거나 처리 정지를 요청할 수 있습니다. 설정 메뉴의 마이페이지·회원탈퇴 등을 통해 요청할 수 있으며, 관련 문의는 고객센터로 연락해 주세요.',
  },
  {
    title: '7. 개인정보의 파기',
    body: '보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로 삭제하고, 종이 문서가 있는 경우 분쇄 또는 소각합니다.',
  },
  {
    title: '8. 개인정보 보호를 위한 조치',
    body: '회사는 개인정보의 안전한 처리를 위해 접근 권한 관리, 암호화, 보안 프로그램 적용 등 기술적·관리적 보호조치를 시행합니다.',
  },
  {
    title: '9. 개인정보 보호책임자',
    body: '개인정보 관련 문의·불만·피해 구제 요청은 서비스 내 고객센터 또는 개인정보 보호책임자(예: privacy@ultary.example)를 통해 접수할 수 있습니다. 접수된 내용은 신속히 답변·처리하겠습니다.',
  },
  {
    title: '10. 고지의 의무',
    body: '본 개인정보처리방침의 내용 추가·삭제·수정이 있을 경우 개정 최소 7일 전부터 서비스 내 공지사항을 통해 고지합니다.',
  },
] as const;

/** 설정 > 이용약관 · 개인정보처리방침 */
export default function TermsClient() {
  const [doc, setDoc] = useState<DocKey>('terms');
  const sections = doc === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const heading = doc === 'terms' ? '이용약관' : '개인정보처리방침';
  const lead =
    doc === 'terms'
      ? '울타리 서비스 이용과 관련된 기본 조건을 안내합니다. (예시 문구이며 실제 서비스 정책에 맞게 수정해 주세요.)'
      : '울타리가 개인정보를 어떻게 수집·이용·보호하는지 안내합니다. (예시 문구이며 실제 서비스 정책에 맞게 수정해 주세요.)';

  return (
    <div className={styles.shell}>
      <PageHeader title="이용약관 · 개인정보" backHref="/settings" />

      <main className={styles.main}>
        <div className={styles.tabs} role="tablist" aria-label="약관 구분">
          <button
            type="button"
            role="tab"
            aria-selected={doc === 'terms'}
            className={clsx(styles.tab, doc === 'terms' && styles.tabActive)}
            onClick={() => setDoc('terms')}
          >
            이용약관
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={doc === 'privacy'}
            className={clsx(styles.tab, doc === 'privacy' && styles.tabActive)}
            onClick={() => setDoc('privacy')}
          >
            개인정보처리방침
          </button>
        </div>

        <section className={styles.noticeBox} aria-label={heading}>
          <h2 className={styles.noticeHeading}>{heading}</h2>
          <p className={styles.noticeLead}>{lead}</p>
          <ul className={styles.noticeList}>
            {sections.map((item) => (
              <li key={item.title} className={styles.noticeItem}>
                <p className={styles.noticeTitle}>{item.title}</p>
                <p className={styles.noticeBody}>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <FooterMenu />
    </div>
  );
}
