async function showStatus(message, type = 'success') {
  const status = document.getElementById("status");
  const statusText = status.querySelector(".status-text");
  
  // 이전 클래스 제거
  status.classList.remove('success', 'error', 'show');
  
  // 새로운 상태 설정
  statusText.textContent = message;
  status.classList.add(type);
  
  // 애니메이션을 위해 약간의 지연 후 표시
  await new Promise(resolve => setTimeout(resolve, 50));
  status.classList.add('show');
  
  console.log(message);
}

document.getElementById("copyButton").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("현재 탭을 찾을 수 없습니다.");
    }

    await showStatus("복사 중...", 'success');

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyIssueToMarkdown,
    });

    // 결과 확인
    const result = results[0].result;
    if (result.success) {
      await showStatus("클립보드에 복사되었습니다! ✨", 'success');
    } else {
      throw new Error(result.error || "알 수 없는 오류 발생");
    }
  } catch (error) {
    console.error("오류 발생:", error);
    await showStatus(error.message, 'error');
  }
});

async function copyIssueToMarkdown() {
  try {
    console.log("이슈 복사 시작...");

    // 현재 URL에서 도메인 추출
    const currentUrl = window.location.origin;
    const domain = currentUrl.split('//')[1];
    console.log("현재 도메인:", domain);

    // DOM 요소 선택자를 객체로 관리
    const selectors = {
      issueId: {
        primary: '.idLink__ee62 .ring-ui-link_c238',
        fallback: '[data-test="ring-link"]'
      },
      title: '[data-test="ticket-summary"]',
      content: '.description__e030'
    };

    // DOM 요소 찾기 함수
    const findElement = (primary, fallback) => {
      const element = document.querySelector(primary) || document.querySelector(fallback);
      if (!element) throw new Error(`요소를 찾을 수 없습니다: ${primary}`);
      return element;
    };

    // 이슈 ID 추출
    const issueIdElement = findElement(selectors.issueId.primary, selectors.issueId.fallback);
    const issueId = issueIdElement.textContent.trim();
    console.log("이슈 ID:", issueId);

    // 이슈 제목 추출
    const titleElement = findElement(selectors.title);
    const title = titleElement.textContent.trim();
    console.log("이슈 제목:", title);

    // 이슈 링크 생성 (동적 도메인 사용)
    const issueLink = `${currentUrl}/issue/${issueId}`;

    // 이슈 내용 추출
    const contentElement = findElement(selectors.content);
    
    // 개선된 컨텐츠 처리 함수
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
        
        // 블록 요소 처리
        if (blockElements.includes(nodeName)) {
          if (depth > 0) result.push('\n');
          
          // 리스트 아이템 처리
          if (nodeName === 'li') {
            result.push('- ');
          }
        }
        
        // 인라인 요소 처리
        if (nodeName === 'strong' || nodeName === 'b') {
          result.push('**');
        } else if (nodeName === 'em' || nodeName === 'i') {
          result.push('*');
        }
        
        // 자식 노드 처리
        for (const child of node.childNodes) {
          result.push(convertToMarkdown(child, depth + 1));
        }
        
        // 닫는 태그 처리
        if (nodeName === 'strong' || nodeName === 'b') {
          result.push('**');
        } else if (nodeName === 'em' || nodeName === 'i') {
          result.push('*');
        }
        
        if (blockElements.includes(nodeName)) {
          result.push('\n');
        }
        
        return result.join('');
      }
      
      const content = convertToMarkdown(clone)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      return content;
    }

    const content = processContent(contentElement);
    console.log("정제된 내용:", content);

    // 마크다운 형식으로 조합
    const markdown = `# ${issueId} ${title}
## 링크: ${issueLink}
## 내용:
${content}`;

    // 클립보드 복사 로직 수정
    function copyToClipboard(text) {
      const textarea = document.createElement('textarea');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        // 우선 execCommand 방식 시도
        const success = document.execCommand('copy');
        if (!success) {
          throw new Error('execCommand copy failed');
        }
      } catch (err) {
        // execCommand 실패 시 clipboard API 시도
        return navigator.clipboard.writeText(text);
      } finally {
        document.body.removeChild(textarea);
      }
      return Promise.resolve();
    }

    // 수정된 복사 함수 호출
    await copyToClipboard(markdown);
    console.log("클립보드 복사 성공");
    return { success: true };

  } catch (error) {
    console.error("이슈 복사 중 오류 발생:", error);
    return { 
      success: false, 
      error: `오류 발생: ${error.message}`,
      details: error.stack 
    };
  }
}
