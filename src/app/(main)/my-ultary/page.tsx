export default function MyUltaryPage() {
  return (
    <main>
      마이울타리
      {/*
        TODO: defaultNickname === true 이면
        「닉네임을 변경해주세요.」 안내를 노출한다.
        실제 변경은 마이페이지/설정에서 PATCH /api/auth/me { nickname } 로 처리.
      */}
    </main>
  );
}
