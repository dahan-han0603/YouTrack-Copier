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
  
  // 3초 후 상태 메시지 숨기기
  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
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

    // 복사 함수 실행
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/js/issueUtils.js']
    });

    // 실제 복사 함수 실행
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        try {
          return await window.copyIssueToMarkdown();
        } catch (error) {
          console.error('복사 중 오류:', error);
          return { success: false, error: error.message };
        }
      }
    });

    const result = results[0].result;
    if (result.success) {
      await showStatus("클립보드에 복사되었습니다! ✨", 'success');
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: '복사 완료',
        message: '이슈가 클립보드에 복사되었습니다.'
      });
    } else {
      throw new Error(result.error || "알 수 없는 오류 발생");
    }
  } catch (error) {
    console.error("오류 발생:", error);
    await showStatus(error.message, 'error');
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: '복사 실패',
      message: '이슈 복사 중 오류가 발생했습니다.'
    });
  }
});
