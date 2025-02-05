# YouTrack Issue Copier

YouTrack의 이슈와 지식베이스 문서를 텍스트 형식으로 변환하여 복사하는 크롬 확장 프로그램입니다.

## 주요 기능

### 이슈 및 지식베이스 복사
- YouTrack 이슈와 지식베이스 문서를 구조화된 텍스트로 변환
- 클립보드에 자동 복사
- 프로젝트명, ID, 제목, 링크, 내용 포함
- 구분선을 통한 가독성 향상

### 편리한 사용성
- 확장 프로그램 팝업 메뉴를 통한 복사 기능
- 컨텍스트 메뉴(우클릭)를 통한 페이지별 맞춤 복사 기능
  - 이슈 페이지: "이슈 복사" 메뉴 표시
  - 지식베이스 페이지: "지식베이스 복사" 메뉴 표시

### 복사 결과 형식
복사된 내용은 다음과 같은 텍스트 형식으로 구성됩니다:
```text
━━━━━━━━━━━━━━━━━━━━
[프로젝트명/ID] 제목
━━━━━━━━━━━━━━━━━━━━
▶ 링크
문서 링크
▶ 내용
들여쓰기된 문서 내용(최대 200자)
━━━━━━━━━━━━━━━━━━━━
```

## 설치 방법
1. 이 저장소를 클론합니다
2. Chrome 브라우저에서 `chrome://extensions`로 이동
3. 개발자 모드를 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. 클론한 디렉토리를 선택

## 사용 방법

### 팝업 메뉴 사용
1. YouTrack 페이지에서 확장 프로그램 아이콘 클릭
2. 현재 페이지에 맞는 복사 버튼 클릭
   - 이슈 페이지: "이슈 복사하기"
   - 지식베이스 페이지: "지식베이스 복사하기"

### 컨텍스트 메뉴 사용
1. YouTrack 페이지에서 우클릭
2. 현재 페이지에 맞는 복사 메뉴 선택
   - 이슈 페이지: "이슈 복사"
   - 지식베이스 페이지: "지식베이스 복사"