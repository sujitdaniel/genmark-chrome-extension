// LinkedIn Profile Analyzer Content Script (Enhanced Version)
// This script injects a toggle button and sidebar panel for AI-powered profile suggestions
// Handles SPA navigation, DOM readiness, and robust selectors

const BACKEND_URL = 'http://127.0.0.1:8000/analyze-profile';
const PANEL_ID = 'linkedin-assistant-profile-panel';
const TOGGLE_ID = 'linkedin-assistant-profile-toggle';

interface ProfileData {
  banner_present: boolean;
  headline: string;
  about: string;
  services: string;
}

interface ApiResponse {
  suggestions: string[];
}

class LinkedInProfileAnalyzer {
  private lastUrl: string = location.href;
  private observer: MutationObserver | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.initOnReady();
    this.observeNavigation();
  }

  // Wait for DOM to be ready, then initialize
  private initOnReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(() => this.reinitialize(), 100);
    } else {
      document.addEventListener('DOMContentLoaded', () => this.reinitialize(), { once: true });
    }
  }

  // SPA navigation detection
  private observeNavigation() {
    this.observer = new MutationObserver(() => {
      const url = location.href;
      if (url !== this.lastUrl) {
        this.lastUrl = url;
        this.retryCount = 0; // Reset retry count on navigation
        setTimeout(() => this.reinitialize(), 1000);
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  // Main entry point: clean up and re-inject if on profile/company page
  private reinitialize() {
    this.cleanup();
    if (this.isProfileOrCompanyPage()) {
      this.injectToggleButton();
    }
  }

  // Detect LinkedIn profile or company page with more patterns
  private isProfileOrCompanyPage(): boolean {
    const path = location.pathname;
    const isProfile = /^\/in\//.test(path) || path.includes('/profile/');
    const isCompany = /^\/company\//.test(path) || path.includes('/organization/');
    // Also check for specific page elements as backup
    const hasProfileElements = document.querySelector('.pv-top-card, .profile-background-image') !== null;
    const hasCompanyElements = document.querySelector('.org-top-card, .organization-outlet') !== null;
    return isProfile || isCompany || hasProfileElements || hasCompanyElements;
  }

  // Remove panel and toggle if present
  private cleanup() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
    const toggle = document.getElementById(TOGGLE_ID);
    if (toggle) toggle.remove();
  }

  // Inject toggle button near profile actions with retry logic
  private injectToggleButton() {
    // Try to find a good anchor for the button
    const anchors = [
      '.pv-top-card-v2-ctas',
      '.pv-top-card__non-self-actions',
      '.org-top-card-primary-actions',
      '.scaffold-layout__aside',
      '.top-card-layout__cta-container',
      '.profile-actions',
      '.pv-top-card-actions', // Additional selector
      '.artdeco-card.ember-view', // Fallback selector
    ];
    let anchor: Element | null = null;
    for (const sel of anchors) {
      anchor = document.querySelector(sel);
      if (anchor) break;
    }
    if (!anchor && this.retryCount < this.maxRetries) {
      // Retry with exponential backoff
      this.retryCount++;
      const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 5000);
      setTimeout(() => this.injectToggleButton(), delay);
      return;
    }
    if (!anchor) {
      // Final fallback: create floating button
      this.createFloatingButton();
      return;
    }
    // Prevent duplicate
    if (document.getElementById(TOGGLE_ID)) return;
    const btn = document.createElement('button');
    btn.id = TOGGLE_ID;
    btn.innerHTML = '🔍 AI Suggestions';
    btn.style.cssText = `
      background: #0a66c2;
      color: #fff;
      border: none;
      border-radius: 24px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      margin: 8px 4px;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      transition: all 0.2s ease;
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    `;
    btn.onmouseenter = () => {
      btn.style.background = '#004182';
      btn.style.transform = 'translateY(-1px)';
    };
    btn.onmouseleave = () => {
      btn.style.background = '#0a66c2';
      btn.style.transform = 'translateY(0)';
    };
    btn.onclick = () => this.togglePanel();
    // Insert button in a good position
    anchor.insertBefore(btn, anchor.firstChild);
  }

  // Create floating button as final fallback
  private createFloatingButton() {
    if (document.getElementById(TOGGLE_ID)) return;
    const btn = document.createElement('button');
    btn.id = TOGGLE_ID;
    btn.innerHTML = '🔍 AI Profile';
    btn.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: #0a66c2;
      color: #fff;
      border: none;
      border-radius: 28px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    `;
    btn.onmouseenter = () => {
      btn.style.background = '#004182';
      btn.style.transform = 'scale(1.05)';
    };
    btn.onmouseleave = () => {
      btn.style.background = '#0a66c2';
      btn.style.transform = 'scale(1)';
    };
    btn.onclick = () => this.togglePanel();
    document.body.appendChild(btn);
  }

  // Show/hide the panel
  private togglePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.remove();
    } else {
      this.injectPanel();
    }
  }

  // Extract profile data using robust selectors with better fallbacks
  private extractProfileData(): ProfileData {
    // Headline selectors (more comprehensive)
    const headlineSelectors = [
      '.text-heading-xlarge',
      '.pv-text-details__about-this-profile-text',
      '.top-card-layout__headline',
      '.pv-top-card--list h1',
      '.org-top-card-summary__title',
      'h1[data-anonymize="headline"]',
      '.top-card-layout__title'
    ];
    // About selectors (more comprehensive)
    const aboutSelectors = [
      '[data-section="summary"] .pv-shared-text-with-see-more',
      '.pv-about-section .pv-shared-text-with-see-more span[aria-hidden="true"]',
      '.about-section .pv-about__summary-text',
      '.summary-section .pv-about__summary-text',
      '.org-page-details__definition-text',
      '.pv-about__summary-text .lt-line-clamp__raw-line'
    ];
    // Services/Skills selectors (more comprehensive)
    const servicesSelectors = [
      '.pv-accomplishments-block__summary',
      '.skills-section .pv-skill-categories-section__expanded',
      '.experience-section .pv-entity__summary-info',
      '.pv-profile-section.skills-section',
      '.experience-section',
      '.org-page-details__definition-text'
    ];
    // Banner selectors (more comprehensive)
    const bannerSelectors = [
      '.profile-background-image',
      '.cover-photo',
      '[data-section="profileBanner"]',
      '.pv-top-card__background-image',
      '.org-top-card-primary-content__logo'
    ];
    // Extract with helper function
    const extractText = (selectors: string[], maxLength: number = 1000): string => {
      for (const sel of selectors) {
        const element = document.querySelector(sel);
        if (element?.textContent?.trim()) {
          return element.textContent.trim().substring(0, maxLength);
        }
      }
      return '';
    };
    const checkExists = (selectors: string[]): boolean => {
      return selectors.some(sel => document.querySelector(sel) !== null);
    };
    const headline = extractText(headlineSelectors, 200) || 'No headline found';
    const about = extractText(aboutSelectors, 1000) || 'No about section found';
    const services = extractText(servicesSelectors, 500) || 'No services information found';
    const banner_present = checkExists(bannerSelectors);
    return { headline, about, services, banner_present };
  }

  // Inject the sidebar panel with improved styling
  private injectPanel() {
    // Prevent duplicate
    if (document.getElementById(PANEL_ID)) return;
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 48px);
      background: #ffffff;
      border: 1px solid #e0e7ff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      padding: 24px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      max-height: 80vh;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      animation: slideIn 0.3s ease-out;
    `;
    // Add CSS animation
    if (!document.getElementById('linkedin-assistant-styles')) {
      const style = document.createElement('style');
      style.id = 'linkedin-assistant-styles';
      style.textContent = `
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(100%); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
      `;
      document.head.appendChild(style);
    }
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">
          💡 AI Profile Insights
        </h3>
        <button onclick="document.getElementById('${PANEL_ID}').remove()" style="
          background: none; 
          border: none; 
          font-size: 20px; 
          cursor: pointer; 
          color: #6b7280;
          padding: 4px;
          border-radius: 4px;
        ">×</button>
      </div>
      <div id="${PANEL_ID}-content" style="line-height: 1.5;">
        <div style="display: flex; align-items: center; gap: 8px; color: #6b7280;">
          <div class="loading-spinner" style="
            width: 16px; 
            height: 16px; 
            border: 2px solid #e5e7eb; 
            border-top: 2px solid #0a66c2; 
            border-radius: 50%; 
            animation: spin 1s linear infinite;
          "></div>
          Analyzing profile...
        </div>
      </div>
    `;
    // Add spinner animation
    const existingStyle = document.getElementById('linkedin-assistant-styles');
    if (existingStyle && !existingStyle.textContent?.includes('spin')) {
      existingStyle.textContent += `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
    }
    document.body.appendChild(panel);
    this.fetchSuggestions(panel);
  }

  // Fetch suggestions from backend and update panel with better error handling
  private async fetchSuggestions(panel: HTMLElement) {
    const content = panel.querySelector(`#${PANEL_ID}-content`)!;
    const profileData = this.extractProfileData();
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 15000); // Increased timeout
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }
      const data: ApiResponse = await res.json();
      if (data?.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        content.innerHTML = `
          <ul style="
            padding-left: 0; 
            margin: 0; 
            list-style: none;
          ">
            ${data.suggestions.map((suggestion: string, index: number) => `
              <li style="
                padding: 12px 16px; 
                margin-bottom: 8px; 
                background: #f8fafc; 
                border-left: 3px solid #0a66c2;
                border-radius: 6px;
                font-size: 14px;
                line-height: 1.4;
              ">
                <strong style="color: #0a66c2;">${index + 1}.</strong> ${suggestion}
              </li>
            `).join('')}
          </ul>
        `;
      } else {
        content.innerHTML = `
          <div style="
            text-align: center; 
            padding: 20px; 
            color: #6b7280;
            font-size: 14px;
          ">
            📝 No specific suggestions available for this profile.
          </div>
        `;
      }
    } catch (err: any) {
      let errorMessage = 'Unknown error occurred';
      let troubleshooting = '';
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out';
        troubleshooting = 'The server might be busy. Please try again.';
      } else if (err.message?.includes('fetch')) {
        errorMessage = 'Cannot connect to backend';
        troubleshooting = 'Make sure the backend server is running at http://127.0.0.1:8000';
      } else {
        errorMessage = err.message || err.toString();
      }
      content.innerHTML = `
        <div style="
          padding: 16px; 
          background: #fef2f2; 
          border: 1px solid #fecaca; 
          border-radius: 6px; 
          color: #dc2626;
          font-size: 14px;
        ">
          <div style="font-weight: 600; margin-bottom: 4px;">⚠️ ${errorMessage}</div>
          ${troubleshooting ? `<div style="font-size: 12px; color: #7f1d1d;">${troubleshooting}</div>` : ''}
        </div>
      `;
    }
  }

  // Cleanup method for proper disposal
  public destroy() {
    this.cleanup();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialize the analyzer
const profileAnalyzer = new LinkedInProfileAnalyzer();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  profileAnalyzer.destroy();
});

export default profileAnalyzer; 