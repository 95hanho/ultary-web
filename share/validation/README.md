# 입력 검사 규칙 (FE / BFF / Spring 공통 스펙)

**최신본:** 이 폴더 + `rules.json`  
Spring 구현: `me._hanho.ultary.common.validation.*` (최종 판정은 항상 Spring)

## 에러 응답 (회원가입 등 Bean Validation)

Spring은 **원래부터 필드 메시지를 내려준다.**  
다만 예전에는 `ProblemDetail`(RFC7807)이라 `success`/`message` 형태가 아니라 BFF가 안 넘기면 FE에 안 보일 수 있다.

현재(통일 후) 400 예:

```json
{
  "success": false,
  "code": "INVALID_INPUT",
  "message": "비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.",
  "data": {
    "password": "비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다."
  },
  "timestamp": "..."
}
```

- `message`: 첫 번째 필드 오류 문구 (토스트/한 줄 표시용)
- `data`: 필드명 → 문구 (인풋 아래 표시용)
- 비즈니스 오류(`NICKNAME_DUPLICATED` 등)도 동일하게 `success:false` + `code` + `message`

BFF는 Spring body의 `message`(및 필요 시 `data`)를 그대로 클라이언트로 전달하면 된다.  
BFF 자체 사전 검사가 없으면 “BFF msg”는 원래 없고, **프록시만** 하면 Spring msg가 나와야 한다.

## 규칙 요약

상세 regex·메시지는 `rules.json` 참고.

| 항목 | 요약 |
|------|------|
| nickname | 영문·한글만. 한글만 2~5 / 영문만 4~10 / 혼합 가중치(한글=2) 합 4~10, 한글≤5. 쿨다운 7일 |
| password | 8~100자, 영문·숫자·특수문자 각 1+ |
| phone | 저장·조회 digits only `^01[0-9]{8,9}$`. 입력 하이픈/`+82` 허용 후 정규화 |
| mention_id / handle | `^[A-Za-z0-9_]{1,30}$` |
| hashtag | `#` 없이 `^[A-Za-z0-9가-힣_]{1,30}$` |

변경 시: `rules.json` → Spring `*Rules.java` → BFF/FE 순.
