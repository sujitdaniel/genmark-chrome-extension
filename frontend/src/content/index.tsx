import React from 'react';
import { createRoot } from 'react-dom/client';

// Types for better TypeScript support
interface ProfileData {
  banner_present: boolean;
  headline: string;
  about: string;
  services: string;
}

interface ApiResponse {
  suggestions: string[];
}

interface ApiError {
  error: string;
  detail?: string;
}

// Configuration constants
const BACKEND_URL = 'http://localhost:5000/analyze-profile';
const SIDEBAR_ROOT_ID = 'linkedin-profile-analyzer-sidebar-root';

// Utility: Check if current page is a LinkedIn profile (personal or company)
function isLinkedInProfilePage(): boolean {
  const url = window.location.href;
  return (
    url.includes('linkedin.com/in/') || url.includes('linkedin.com/company/')
  );
}

// Utility: Extract profile data from DOM with robust selectors
function extractProfileData(): ProfileData {
  // Banner: look for banner image or div with multiple selectors
  const bannerSelectors = [
    '[data-test-id="profile-background-image"] img',
    '.profile-background-image img',
    '.org-top-card-background-image__image',
    '.pv-top-card-profile-picture__image',
    '.profile-background-image'
  ];
  
  const banner = document.querySelector(bannerSelectors.join(', '));
  const banner_present = !!banner;

  // Headline: personal and company profiles differ
  const headlineSelectors = [
    '.text-body-medium.break-words',
    '.org-top-card-summary__tagline',
    '.top-card-layout__headline',
    '.pv-text-details__left-panel h2',
    '.org-top-card__headline'
  ];
  
  let headline = '';
  const headlineEl = document.querySelector(headlineSelectors.join(', '));
  if (headlineEl) headline = headlineEl.textContent?.trim() || '';

  // About section with multiple selectors
  const aboutSelectors = [
    '#about [data-test-id="about-section"] p',
    'section.pv-about-section > p',
    '.about__description',
    '.core-section-container__content p',
    '.pv-about__summary-text'
  ];
  
  let about = '';
  const aboutEl = document.querySelector(aboutSelectors.join(', '));
  if (aboutEl) about = aboutEl.textContent?.trim() || '';

  // Services section (if available)
  const servicesSelectors = [
    '[data-test-id="services-section"] p',
    '.services-section__content',
    '.org-services-section__description'
  ];
  
  let services = '';
  const servicesEl = document.querySelector(servicesSelectors.join(', '));
  if (servicesEl) services = servicesEl.textContent?.trim() || '';

  return { banner_present, headline, about, services };
}

// Sidebar React component with loading and error states
const sidebarStyles: React.CSSProperties = {
  position: 'fixed',
  top: '80px',
  right: 0,
  width: '340px',
  background: '#fff',
  borderLeft: '1px solid #e5e7eb',
  boxShadow: '-2px 0 8px rgba(0,0,0,0.08)',
  zIndex: 9999,
  height: 'calc(100vh - 100px)',
  overflowY: 'auto',
  padding: '24px 18px',
  fontFamily: 'system-ui, sans-serif',
};

const headerStyles: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '1.2rem',
  marginBottom: '12px',
  color: '#2563eb',
};

const suggestionStyles: React.CSSProperties = {
  background: '#f1f5f9',
  borderRadius: '6px',
  padding: '10px 12px',
  marginBottom: '10px',
  color: '#334155',
  fontSize: '1rem',
  lineHeight: '1.5',
};

const errorStyles: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#dc2626',
  fontSize: '0.9rem',
};

const loadingStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  color: '#64748b',
};

function Sidebar({ 
  suggestions, 
  loading, 
  error 
}: { 
  suggestions: string[];
  loading: boolean;
  error?: string;
}) {
  return (
    <div 
      style={sidebarStyles} 
      className="linkedin-assistant-sidebar"
      role="complementary"
      aria-label="LinkedIn Profile Improvement Suggestions"
    >
      <div style={headerStyles}>
        💡 Profile Improvement Suggestions
      </div>
      
      {loading && (
        <div style={loadingStyles}>
          <span>Analyzing profile...</span>
        </div>
      )}
      
      {error && (
        <div style={errorStyles} role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {!loading && !error && suggestions.length === 0 && (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
          No suggestions available for this profile.
        </div>
      )}
      
      {!loading && !error && suggestions.length > 0 && (
        <div role="list">
          {suggestions.map((suggestion, i) => (
            <div 
              key={i} 
              style={suggestionStyles}
              role="listitem"
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main logic: Only run on profile pages
async function main(): Promise<void> {
  if (!isLinkedInProfilePage()) return;

  // Prevent duplicate injection
  if (document.getElementById(SIDEBAR_ROOT_ID)) return;

  // Extract data
  const profileData = extractProfileData();
  
  // Skip if no meaningful data found
  if (!profileData.headline && !profileData.about) {
    return;
  }

  // Inject sidebar root
  const rootDiv = document.createElement('div');
  rootDiv.id = SIDEBAR_ROOT_ID;
  document.body.appendChild(rootDiv);

  // Render sidebar with loading state
  const root = createRoot(rootDiv);
  root.render(<Sidebar suggestions={[]} loading={true} />);

  // Send to backend with error handling
  let suggestions: string[] = [];
  let error: string | undefined = undefined;
  
  try {
    const resp = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    
    if (resp.ok) {
      const data: ApiResponse = await resp.json();
      suggestions = data.suggestions || [];
    } else {
      const errorData: ApiError = await resp.json();
      error = errorData.detail || errorData.error || 'Failed to fetch suggestions from backend.';
    }
  } catch (e) {
    error = 'Error connecting to backend. Please check if the server is running.';
  }

  // Update sidebar with results
  root.render(<Sidebar suggestions={suggestions} loading={false} error={error} />);
}

// Run on DOMContentLoaded and on LinkedIn's client-side navigation
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
