// 컨텍스트 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copyIssue",
    title: "이슈 복사",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtrack.cloud/*"]
  });
});

// 컨텍스트 메뉴 클릭 이벤트 처리
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "copyIssue") {
    try {
      // 먼저 issueUtils.js 주입
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/js/issueUtils.js']
      });

      // 그 다음 복사 함수 실행
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          try {
            return await window.copyIssueToMarkdown();
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      });

      const result = results[0].result;
      if (result.success) {
        // 성공 알림
        await chrome.notifications.create({
          type: 'basic',
          // iconUrl: 'icons/icon48.png',  // 기본 아이콘 필요
          title: '복사 완료',
          message: '이슈가 클립보드에 복사되었습니다.'
        });
      } else {
        throw new Error(result.error || '클립보드 복사 실패');
      }
    } catch (error) {
      // 실패 알림
      await chrome.notifications.create({
        type: 'basic',
        // iconUrl: 'icons/icon48.png',  // 기본 아이콘 필요
        title: '복사 실패',
        message: '이슈 복사 중 오류가 발생했습니다.'
      });
    }
  }
}); 