// IIFE(즉시 실행 함수)로 감싸서 변수 스코프 격리
(function() {
  // 이미 로드된 경우 중복 실행 방지
  if (window.copyIssueToMarkdown) {
    return;
  }

  // 복사 함수 정의
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

  // DOM 요소 선택자를 함수 내부로 이동
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
      }
    };
  }

  // DOM 요소 찾기 함수
  function findElement(primary, fallback) {
    const element = document.querySelector(primary) || document.querySelector(fallback);
    if (!element) throw new Error(`요소를 찾을 수 없습니다: ${primary}`);
    return element;
  }

  // 컨텐츠 처리 함수
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

  // 텍스트 길이 제한 함수 추가
  function truncateText(text, maxLength = 200) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // 이슈 복사 메인 함수 수정
  async function copyIssueToMarkdown() {
    try {
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

  // 함수를 window 객체에 할당
  window.copyIssueToMarkdown = copyIssueToMarkdown;
})(); 