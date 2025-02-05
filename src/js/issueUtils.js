// IIFE(즉시 실행 함수)로 감싸서 변수 스코프 격리
(function() {
  // 이미 로드된 경우 중복 실행 방지
  if (window.copyIssueToMarkdown) {
    return;
  }

  /**
   * 텍스트를 클립보드에 복사하는 함수
   * @param {string} text - 복사할 텍스트
   * @returns {Promise<boolean>} 복사 성공 여부
   */
  async function copyToClipboard(text) {
    try {
      // 먼저 navigator.clipboard API 시도
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      try {
        // fallback: 임시 textarea 요소 사용
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch (fallbackErr) {
        console.error('클립보드 복사 실패:', fallbackErr);
        return false;
      }
    }
  }

  /**
   * DOM 선택자들을 반환하는 함수
   * @returns {Object} 이슈와 지식베이스 페이지의 DOM 선택자들
   */
  function getSelectors() {
    return {
      issueId: {
        primary: '.idLink__ee62 .ring-ui-link_c238',
        fallback: '[data-test="ring-link"]'
      },
      title: '[data-test="ticket-summary"]',
      content: '.description__e030',
      project: {
        primary: '.fieldValue__e480[data-test="ring-tooltip field-value"]',
        fallback: '.fieldValueButton__a700'
      },
      knowledgeBase: {
        id: '.idLink__ee62 .articleId__ca09',
        title: '.header__efad h1',
        content: '.articleContent__cdf9',
        project: '.breadCrumb__c48e.nonShrinkable__cca0'
      }
    };
  }

  /**
   * DOM 요소를 찾는 함수
   * @param {string} primary - 기본 선택자
   * @param {string} fallback - 대체 선택자
   * @returns {Element} 찾은 DOM 요소
   * @throws {Error} 요소를 찾지 못한 경우
   */
  function findElement(primary, fallback) {
    const element = document.querySelector(primary) || document.querySelector(fallback);
    if (!element) throw new Error(`요소를 찾을 수 없습니다: ${primary}`);
    return element;
  }

  /**
   * HTML 컨텐츠를 마크다운으로 변환하는 함수
   * @param {Element} element - 변환할 HTML 요소
   * @returns {string} 변환된 마크다운 텍스트
   */
  function processContent(element) {
    const blockElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'li'];
    const clone = element.cloneNode(true);
    
    // 불필요한 요소 제거
    clone.querySelectorAll('a.c_permamlink__aa7').forEach(el => el.remove());
    
    // 마크다운 변환 함수
    function convertToMarkdown(node, depth = 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim();
      }
      
      let result = [];
      const nodeName = node.nodeName.toLowerCase();
      
      if (blockElements.includes(nodeName)) {
        if (depth > 0) result.push('\n');
        if (nodeName === 'li') result.push('- ');
      }
      
      if (nodeName === 'strong' || nodeName === 'b') result.push('**');
      else if (nodeName === 'em' || nodeName === 'i') result.push('*');
      
      for (const child of node.childNodes) {
        result.push(convertToMarkdown(child, depth + 1));
      }
      
      if (nodeName === 'strong' || nodeName === 'b') result.push('**');
      else if (nodeName === 'em' || nodeName === 'i') result.push('*');
      
      if (blockElements.includes(nodeName)) result.push('\n');
      
      return result.join('');
    }
    
    return convertToMarkdown(clone).replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * 텍스트를 지정된 길이로 제한하는 함수
   * @param {string} text - 원본 텍스트
   * @param {number} maxLength - 최대 길이 (기본값: 200)
   * @returns {string} 제한된 텍스트
   */
  function truncateText(text, maxLength = 200) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 현재 페이지의 타입을 확인하는 함수
   * @returns {'issue'|'knowledgeBase'|'unknown'} 페이지 타입
   */
  function checkPageType() {
    const url = window.location.href;
    // YouTrack의 이슈 URL 패턴을 더 정확하게 체크
    if (url.match(/youtrack\.cloud\/issue\/.+/) || url.includes('/agiles/') || url.includes('/issues/')) {
      return 'issue';
    } else if (url.includes('/articles/')) {
      return 'knowledgeBase';
    }
    return 'unknown';
  }

  /**
   * YouTrack 이슈를 마크다운 형식으로 복사하는 함수
   * @returns {Promise<Object>} 복사 결과 객체
   * @property {boolean} success - 복사 성공 여부
   * @property {string} [markdown] - 생성된 마크다운 텍스트
   * @property {string} [error] - 오류 메시지
   * @property {string} [details] - 상세 오류 정보
   */
  async function copyIssueToMarkdown() {
    try {
      const pageType = checkPageType();
      if (pageType !== 'issue') {
        return {
          success: false,
          error: '이슈 페이지에서만 사용할 수 있습니다.'
        };
      }

      const selectors = getSelectors();
      
      // 프로젝트 이름 추출
      const projectElement = findElement(selectors.project.primary, selectors.project.fallback);
      const projectName = projectElement.textContent.trim();

      // 이슈 ID 추출
      const issueIdElement = findElement(selectors.issueId.primary, selectors.issueId.fallback);
      const issueId = issueIdElement.textContent.trim();

      // 이슈 제목 추출
      const titleElement = findElement(selectors.title);
      const title = titleElement.textContent.trim();

      // 이슈 링크 생성
      const currentUrl = window.location.origin;
      const issueLink = `${currentUrl}/issue/${issueId}`;

      // 이슈 내용 추출 및 처리
      const contentElement = findElement(selectors.content);
      let content = processContent(contentElement);
      content = content.replace(/\n{2,}/g, '\n'); // 연속된 개행 처리
      content = truncateText(content); // 길이 제한 적용
      content = content.split('\n').map(line => '  ' + line).join('\n'); // 들여쓰기 적용

      // 구분선 정의
      const separator = '━'.repeat(20);

      // 새로운 템플릿 형식으로 조합 (프로젝트명 추가)
      const markdown = `${separator}
[${projectName}/${issueId}] ${title}
${separator}
▶ 링크
  ${issueLink}
▶ 내용
${content}
${separator}`;
      
      // 클립보드에 복사
      const success = await copyToClipboard(markdown);
      return { success, markdown };
    } catch (error) {
      console.error("이슈 복사 중 오류 발생:", error);
      return { 
        success: false, 
        error: `오류 발생: ${error.message}`,
        details: error.stack 
      };
    }
  }

  /**
   * YouTrack 지식베이스 문서를 마크다운 형식으로 복사하는 함수
   * @returns {Promise<Object>} 복사 결과 객체
   * @property {boolean} success - 복사 성공 여부
   * @property {string} [markdown] - 생성된 마크다운 텍스트
   * @property {string} [error] - 오류 메시지
   * @property {string} [details] - 상세 오류 정보
   */
  async function copyKnowledgeBaseToMarkdown() {
    try {
      const pageType = checkPageType();
      if (pageType !== 'knowledgeBase') {
        return {
          success: false,
          error: '지식베이스 페이지에서만 사용할 수 있습니다.'
        };
      }

      const selectors = getSelectors();
      
      // 프로젝트 이름 추출
      const projectElement = document.querySelector(selectors.knowledgeBase.project);
      const projectName = projectElement.textContent.trim();

      // 지식베이스 ID 추출
      const idElement = document.querySelector(selectors.knowledgeBase.id);
      const kbId = idElement.textContent.trim();

      // 제목 추출
      const titleElement = document.querySelector(selectors.knowledgeBase.title);
      const title = titleElement.textContent.trim();

      // 링크 생성
      const currentUrl = window.location.href;

      // 내용 추출 및 처리
      const contentElement = document.querySelector(selectors.knowledgeBase.content);
      let content = processContent(contentElement);
      content = content.replace(/\n{2,}/g, '\n'); // 연속된 개행 처리
      content = truncateText(content); // 길이 제한 적용
      content = content.split('\n').map(line => '  ' + line).join('\n'); // 들여쓰기 적용

      // 구분선 정의
      const separator = '━'.repeat(20);

      // 템플릿 형식으로 조합
      const markdown = `${separator}
[${projectName}/${kbId}] ${title}
${separator}
▶ 링크
  ${currentUrl}
▶ 내용
${content}
${separator}`;
      
      // 클립보드에 복사
      const success = await copyToClipboard(markdown);
      return { success, markdown };
    } catch (error) {
      console.error("지식베이스 복사 중 오류 발생:", error);
      return { 
        success: false, 
        error: `오류 발생: ${error.message}`,
        details: error.stack 
      };
    }
  }

  // 함수를 window 객체에 할당
  window.copyIssueToMarkdown = copyIssueToMarkdown;
  window.copyKnowledgeBaseToMarkdown = copyKnowledgeBaseToMarkdown;
})(); 