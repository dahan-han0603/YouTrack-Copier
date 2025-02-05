// 컨텍스트 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  // 이슈 복사 메뉴 - 이슈 페이지에서만 표시
  chrome.contextMenus.create({
    id: "copyIssue",
    title: "이슈 복사",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtrack.cloud/issue/*"]
  });

  // 지식베이스 복사 메뉴 - 지식베이스 페이지에서만 표시
  chrome.contextMenus.create({
    id: "copyKnowledgeBase",
    title: "지식베이스 복사",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtrack.cloud/articles/*"]
  });
});

// 컨텍스트 메뉴 클릭 이벤트 처리
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // 복사 함수 실행
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/js/issueUtils.js']
    });

    // 실제 복사 함수 실행
    const copyResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (menuId) => {
        try {
          // 메뉴 ID에 따라 다른 함수 호출
          if (menuId === "copyIssue") {
            return await window.copyIssueToMarkdown();
          } else if (menuId === "copyKnowledgeBase") {
            return await window.copyKnowledgeBaseToMarkdown();
          }
          throw new Error("지원하지 않는 메뉴입니다.");
        } catch (error) {
          console.error('복사 중 오류:', error);
          return { success: false, error: error.message };
        }
      },
      args: [info.menuItemId]
    });

    const result = copyResults[0].result;
    if (result.success) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: '복사 완료',
        message: '클립보드에 복사되었습니다.'
      });
    } else {
      throw new Error(result.error || '클립보드 복사 실패');
    }
  } catch (error) {
    console.error('컨텍스트 메뉴 처리 중 오류:', error);
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: '복사 실패',
      message: '복사 중 오류가 발생했습니다.'
    });
  }
}); 