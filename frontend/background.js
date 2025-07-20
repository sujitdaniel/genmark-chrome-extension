// background.js for LinkedIn Social Assistant Chrome Extension
// Manifest V3: runs as a service worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Social Assistant installed!');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // You can add logic here for future features (e.g., badge updates)
  if (changeInfo.status === 'complete') {
    // Example: log tab updates
    console.log('Tab updated:', tab.url);
  }
}); 