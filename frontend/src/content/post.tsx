import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

console.log('[LSA] post.tsx loaded', location.href);

// Types for better TypeScript support


interface CommentObj {
  type: string;
  text: string;
}

interface ApiResponse {
  comments: CommentObj[];
}

interface ApiError {
  error: string;
  detail?: string;
}

// Configuration constants
const BACKEND_URL = 'http://localhost:8000/generate-comments';
const PANEL_STYLE: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '12px 16px',
  fontFamily: 'sans-serif',
  marginTop: '12px',
  boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
  maxWidth: '700px',
};

const COMMENT_STYLE: React.CSSProperties = {
  fontSize: '0.95rem',
  padding: '6px 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
};

const BUTTON_STYLE: React.CSSProperties = {
  fontSize: '0.8rem',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '4px 8px',
  marginLeft: '8px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'background-color 0.2s',
};

const loadingStyle: React.CSSProperties = {
  ...PANEL_STYLE,
  background: '#f8fafc',
  color: '#64748b',
  textAlign: 'center',
  padding: '20px',
};

const errorStyle: React.CSSProperties = {
  ...PANEL_STYLE,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#dc2626',
};

// Utility: Check if on LinkedIn post page
function isPostPage(): boolean {
  const p = location.pathname;
  return p.startsWith("/feed/update/") || p.startsWith("/posts/");
}

// Utility: Extract main post data with robust selectors
function extractMainPost(): { post: HTMLElement; postText: string; author: string } | null {
  const postSelectors = [
    'div[data-test-id="main-feed-activity-card"]',
    '.scaffold-finite-scroll__content > div',
    'article',
    '.feed-shared-update-v2',
    '[data-test-id="feed-shared-update-v2"]'
  ];
  
  const post = document.querySelector<HTMLElement>(postSelectors.join(', '));
  if (!post) return null;
  
  const textSelectors = [
    '[data-test-id="post-content"]',
    '.update-components-text',
    '.feed-shared-update-v2__description',
    '.break-words',
    '.feed-shared-text',
    '.feed-shared-update-v2__commentary',
    '.feed-shared-update-v2__content',
    '[data-test-id="main-feed-activity-card"] [dir="ltr"]', // sometimes the text lives here
    'div[data-urn][data-test-id] [dir="ltr"]'
  ];
  
  let postText = '';
  const textEl = post.querySelector(textSelectors.join(', '));
  if (textEl) postText = textEl.textContent?.trim() || '';
  
  const authorSelectors = [
    '.feed-shared-actor__name',
    '.update-components-actor__name',
    '.feed-shared-actor__title',
    '.feed-shared-actor__name-link'
  ];
  
  let author = '';
  const authorEl = post.querySelector(authorSelectors.join(', '));
  if (authorEl) author = authorEl.textContent?.trim() || '';
  
  return { post, postText, author };
}

// Utility: Insert panel below post content
function insertPanelBelowPost(post: HTMLElement, panel: HTMLElement): void {
  const contentSelectors = [
    '[data-test-id="post-content"]',
    '.update-components-text',
    '.feed-shared-update-v2__description',
    '.break-words',
    '.feed-shared-text',
    '.feed-shared-update-v2__commentary'
  ];
  
  const content = post.querySelector(contentSelectors.join(', '));
  if (content && content.parentElement) {
    content.parentElement.insertAdjacentElement('afterend', panel);
  } else {
    post.appendChild(panel);
  }
}

// Comment suggestions component with loading and error states
function CommentSuggestions({ 
  comments, 
  loading, 
  error, 
  onCopy, 
  onInsert,
  onRegenerate
}: { 
  comments: CommentObj[];
  loading: boolean;
  error?: string;
  onCopy: (text: string) => void;
  onInsert: (text: string) => void;
  onRegenerate: () => void;
}) {
  return (
    <div 
      style={PANEL_STYLE} 
      className="linkedin-assistant-comment-panel"
      role="complementary"
      aria-label="AI Comment Suggestions"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>
          💡 AI Comment Suggestions
        </div>
        <div>
          <button
            style={BUTTON_STYLE}
            onClick={onRegenerate}
            disabled={loading}
            aria-label="Regenerate suggestions"
          >
            ⟲ Regenerate
          </button>
        </div>
      </div>

      {loading && (
        <div style={loadingStyle}>
          <span>Generating suggestions...</span>
        </div>
      )}
      
      {error && (
        <div style={errorStyle} role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {!loading && !error && comments.length === 0 && (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
          No suggestions available for this post.
        </div>
      )}
      
      {!loading && !error && comments.length > 0 && (
        <div role="list">
          {comments.map((comment, i) => (
            <div key={i} style={COMMENT_STYLE} role="listitem">
              <span>
                <strong>{comment.type.charAt(0).toUpperCase() + comment.type.slice(1)}:</strong> {comment.text}
              </span>
              <span>
                <button 
                  style={BUTTON_STYLE} 
                  onClick={() => onCopy(comment.text)}
                  aria-label={`Copy ${comment.type} comment`}
                >
                  Copy
                </button>
                <button 
                  style={BUTTON_STYLE} 
                  onClick={() => onInsert(comment.text)}
                  aria-label={`Insert ${comment.type} comment`}
                >
                  Insert
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Utility: Copy text to clipboard
function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
}

// Utility: Insert comment into LinkedIn's comment box
function insertComment(text: string, postEl?: HTMLElement): void {
  const root: ParentNode = postEl ?? document;

  const textarea = root.querySelector<HTMLElement>([
    '[data-test-live-comment-focus-target="true"] [contenteditable="true"]',
    '[data-test-id="comment"] [contenteditable="true"]',
    '.comments-comment-box__form [contenteditable="true"]',
    '.comments-comment-texteditor [contenteditable="true"]',
    '[contenteditable="true"]'
  ].join(', '));

  if (!textarea) {
    // fallback: copy and prompt manual paste
    navigator.clipboard.writeText(text);
    alert("Copied. Click the comment box and paste (Ctrl/⌘+V).");
    return;
  }

  textarea.focus();
  // Try native insertion first
  const ok = document.execCommand?.('insertText', false, text);
  if (!ok) {
    // fallback set textContent and dispatch input
    textarea.textContent = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Main function to render the comment panel
function renderPanel(post: HTMLElement, postText: string, author: string): void {
  if (post.querySelector('.linkedin-assistant-comment-panel')) return;
  
  const panelDiv = document.createElement('div');
  panelDiv.className = 'linkedin-assistant-comment-panel';
  insertPanelBelowPost(post, panelDiv);
  
  function PanelContainer() {
    const [comments, setComments] = useState<CommentObj[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [attempt, setAttempt] = useState(0); // to trigger refetch

    const fetchComments = () => {
      setLoading(true);
      setError(undefined);

      if (!postText || postText.length < 10) {
        setLoading(false);
        setComments([]);
        setError('Post too short for suggestions.');
        return;
      }

      fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_text: postText, author }),
      })
        .then(async (resp) => {
          if (!resp.ok) {
            const errorData: ApiError = await resp.json().catch(() => ({} as ApiError));
            throw new Error(errorData.detail || errorData.error || 'Backend error');
          }
          const data: ApiResponse = await resp.json();
          setComments(Array.isArray(data.comments) ? data.comments : []);
        })
        .catch((e) => {
          setError(e.message || 'Failed to fetch suggestions.');
        })
        .finally(() => setLoading(false));
    };

    useEffect(() => {
      fetchComments();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postText, author, attempt]);

    return (
      <CommentSuggestions
        comments={comments}
        loading={loading}
        error={error}
        onCopy={copyToClipboard}
        onInsert={(t) => insertComment(t, post)}
        onRegenerate={() => setAttempt(a => a + 1)}
      />
    );
  }
  
  createRoot(panelDiv).render(<PanelContainer />);
}

// Main logic: Only run on post pages
function main(): void {
  if (!isPostPage()) return;
  
  const extracted = extractMainPost();
  console.log("[LSA] extracted:", extracted ? { textLen: extracted.postText.length, author: extracted.author } : "none");
  if (!extracted) return;
  
  const { post, postText, author } = extracted;
  renderPanel(post, postText, author);
}

// Run on DOMContentLoaded and on SPA navigation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// For SPA navigation (LinkedIn uses client-side routing)
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    main();
  }
}, 1000);

// MutationObserver for rerenders
const observer = new MutationObserver(() => {
  main();
});
observer.observe(document.body, { childList: true, subtree: true }); 