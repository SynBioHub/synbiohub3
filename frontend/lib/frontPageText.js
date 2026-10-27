import showdown from 'showdown';

const sdconverter = new showdown.Converter();

/** localStorage key for markdown source (editor); config stores HTML. */
export const FRONT_PAGE_MARKDOWN_KEY = 'frontPageTextMarkdown';

/**
 * Convert markdown front-page text to HTML for SBH1-compatible storage.
 * @param {string} markdown
 * @returns {string}
 */
export function toFrontPageHtml(markdown) {
  const source = (markdown || '').replace(/\\n/g, '\n');
  return sdconverter.makeHtml(source);
}

export function getFrontPageMarkdown() {
  try {
    return localStorage.getItem(FRONT_PAGE_MARKDOWN_KEY);
  } catch {
    return null;
  }
}

export function setFrontPageMarkdown(markdown) {
  try {
    localStorage.setItem(FRONT_PAGE_MARKDOWN_KEY, markdown || '');
  } catch {
    // ignore storage errors
  }
}
