import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function Popup() {
  const openSidePanel = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  };

  return (
    <div className="popup-container">
      <h1 className="title">LinkedIn Social Assistant</h1>
      <p className="description">
        Your AI-powered productivity toolkit for LinkedIn.
      </p>
      <button className="button" onClick={openSidePanel}>
        Open Assistant
      </button>
      <p className="footer">
        Analyze profiles, classify posts, and generate comments with ease.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
