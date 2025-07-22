import React from 'react';
import { createRoot } from 'react-dom/client';

// Types for better TypeScript support
interface PostData {
  post_text: string;
  author: string;
}

interface Classification {
  industry: string;
  tone: string;
  topic: string;
  summary: string;
}

interface ApiError {
  error: string;
  detail?: string;
}

// Configuration constants
const BACKEND_URL = 'http://127.0.0.1:8000/classify-post';
const OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute',
  right: '12px',
  bottom: '12px',
  background: '#f1f5f9',
  color: '#1e293b',
  fontSize: '0.9rem',
  padding: '8px 12px',
  borderRadius: '8px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  zIndex: 9999,
  maxWidth: '320px',
  pointerEvents: 'auto',
  fontFamily: 'system-ui, sans-serif',
  lineHeight: '1.4',
};

const loadingStyle: React.CSSProperties = {
  ...OVERLAY_STYLE,
  background: '#f8fafc',
  color: '#64748b',
  fontSize: '0.8rem',
};

const errorStyle: React.CSSProperties = {
  ...OVERLAY_STYLE,
  background: '#fef2f2',
  color: '#dc2626',
  fontSize: '0.8rem',
  border: '1px solid #fecaca',
};

// Utility: Check if on LinkedIn feed page
function isFeedPage(): boolean {
  return /linkedin.com\/feed\//.test(window.location.href);
}

// Utility: Find all feed posts with robust selectors
function getFeedPosts(): HTMLElement[] {
  const postSelectors = [
    'div.feed-shared-update-v2',
    'div[data-id^="urn:li:activity"]',
    'article',
    '.feed-shared-update-v2',
    '[data-test-id="feed-shared-update-v2"]'
  ];
  return Array.from(document.querySelectorAll<HTMLElement>(postSelectors.join(', ')));
}

// Utility: Detect ads/promoted posts
function isAdOrPromoted(post: HTMLElement): boolean {
  const adSelectors = [
    '[data-test-ad-label]',
    '.feed-shared-actor__supplementary-actor',
    '[aria-label*="Promoted"]',
    '.feed-shared-actor__supplementary-actor-info'
  ];
  
  // Check for ad labels
  const adLabel = post.querySelector(adSelectors.join(', '));
  if (adLabel && /promoted|ad|sponsored/i.test(adLabel.textContent || '')) {
    return true;
  }
  
  // Check for sponsored text in HTML
  if (post.innerHTML.includes('Sponsored') || post.innerHTML.includes('Promoted')) {
    return true;
  }
  
  return false;
}

// Utility: Extract post text and author with robust selectors
function extractPostData(post: HTMLElement): PostData {
  const textSelectors = [
    '[data-test-feed-shared-update-v2-content]',
    '.feed-shared-update-v2__description',
    'span.break-words',
    '.update-components-text',
    '.feed-shared-text',
    '.feed-shared-update-v2__commentary',
    '.feed-shared-update-v2__content'
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
  
  return { post_text: postText, author };
}

// Overlay React component with loading and error states
function Overlay({ 
  classification, 
  loading, 
  error 
}: { 
  classification?: Classification;
  loading: boolean;
  error?: string;
}) {
  if (loading) {
    return (
      <div style={loadingStyle} className="linkedin-assistant-overlay" role="status">
        <span>Analyzing post...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={errorStyle} className="linkedin-assistant-overlay" role="alert">
        <span>Error: {error}</span>
      </div>
    );
  }
  
  if (!classification) {
    return null;
  }
  
  return (
    <div style={OVERLAY_STYLE} className="linkedin-assistant-overlay" role="complementary">
      <div><strong>Summary:</strong> {classification.summary}</div>
      <div><strong>Tone:</strong> {classification.tone}</div>
      <div><strong>Topic:</strong> {classification.topic}</div>
      <div><strong>Industry:</strong> {classification.industry}</div>
    </div>
  );
}

// Main logic: Track analyzed posts to avoid duplicates
const analyzedPosts = new WeakSet<HTMLElement>();

async function classifyAndOverlay(post: HTMLElement): Promise<void> {
  if (analyzedPosts.has(post)) return;
  analyzedPosts.add(post);

  // Skip ads/promoted posts
  if (isAdOrPromoted(post)) return;

  // Prevent multiple overlays
  if (post.querySelector('.linkedin-assistant-overlay')) return;

  const { post_text, author } = extractPostData(post);
  
  // Skip empty/short posts
  if (!post_text || post_text.length < 10) return;

  // Inject overlay container
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'linkedin-assistant-overlay';
  overlayDiv.style.position = 'relative';
  overlayDiv.style.width = '100%';
  overlayDiv.style.height = '0';
  overlayDiv.style.zIndex = '9999';
  post.style.position = 'relative';
  post.appendChild(overlayDiv);
  
  // Render loading state
  const root = createRoot(overlayDiv);
  root.render(<Overlay loading={true} />);

  // Send to backend with error handling
  let classification: Classification | undefined = undefined;
  let error: string | undefined = undefined;
  
  try {
    const resp = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_text, author }),
    });
    
    if (resp.ok) {
      const data = await resp.json();
      classification = data;
    } else {
      const errorData: ApiError = await resp.json();
      error = errorData.detail || errorData.error || 'Failed to classify post.';
    }
  } catch (e) {
    error = 'Error connecting to backend.';
  }

  // Update overlay with results
  root.render(<Overlay classification={classification} loading={false} error={error} />);
}

function observeFeedPosts(): void {
  const posts = getFeedPosts();
  posts.forEach(post => {
    if (!analyzedPosts.has(post)) {
      // Use IntersectionObserver to only analyze visible posts
      const observer = new window.IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            classifyAndOverlay(post);
            obs.disconnect();
          }
        });
      }, { threshold: 0.5 });
      observer.observe(post);
    }
  });
}

function main(): void {
  if (!isFeedPage()) return;
  
  // Initial scan
  observeFeedPosts();
  
  // Observe DOM for new posts (infinite scroll)
  const feedContainer = document.querySelector('div.feed-container, main, #main');
  const mutationObserver = new MutationObserver(() => {
    observeFeedPosts();
  });
  
  if (feedContainer) {
    mutationObserver.observe(feedContainer, { childList: true, subtree: true });
  } else {
    // Fallback: poll for new posts
    setInterval(observeFeedPosts, 2000);
  }
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