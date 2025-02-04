// 복사 함수 정의
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('클립보드 복사 실패:', err);
    return false;
  }
}

// DOM 요소 선택자
const selectors = {
  issueId: {
    primary: '.idLink__ee62 .ring-ui-link_c238',
    fallback: '[data-test="ring-link"]'
  },
  title: '[data-test="ticket-summary"]',
  content: '.description__e030'
};

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

// 이슈 복사 메인 함수
async function copyIssueToMarkdown() {
  try {
    // 이슈 ID 추출
    const issueIdElement = findElement(selectors.issueId.primary, selectors.issueId.fallback);
    const issueId = issueIdElement.textContent.trim();

    // 이슈 제목 추출
    const titleElement = findElement(selectors.title);
    const title = titleElement.textContent.trim();

    // 이슈 링크 생성
    const currentUrl = window.location.origin;
    const issueLink = `${currentUrl}/issue/${issueId}`;

    // 이슈 내용 추출
    const contentElement = findElement(selectors.content);
    const content = processContent(contentElement);

    // 마크다운 형식으로 조합
    const markdown = `# ${issueId} ${title}\n## 링크: ${issueLink}\n## 내용:\n${content}`;
    
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