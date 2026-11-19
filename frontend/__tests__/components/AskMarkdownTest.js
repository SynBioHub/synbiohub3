import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/config', () => () => ({
  publicRuntimeConfig: { backend: 'http://localhost:7777' }
}));

import { Markdown } from '../../components/Search/Ask/Ask';

const html = text => renderToStaticMarkup(<Markdown text={text} />);

describe('Ask answer Markdown', () => {
  beforeEach(() => {
    localStorage.setItem(
      'registries',
      JSON.stringify([
        { uri: 'https://synbiohub.org', url: 'http://localhost:7777' }
      ])
    );
  });

  test('renders paragraphs, lists, bold and code', () => {
    expect(
      html(
        'Two parts:\n\n- **BBa_B0015** is a `terminator`\n- BBa_B0034\n\n1. first\n2. second'
      )
    ).toBe(
      '<p>Two parts:</p>' +
        '<ul><li><strong>BBa_B0015</strong> is a <code>terminator</code></li><li>BBa_B0034</li></ul>' +
        '<ol><li>first</li><li>second</li></ol>'
    );
  });

  test('joins wrapped lines into one paragraph', () => {
    expect(html('one\ntwo\n\nthree')).toBe('<p>one two</p><p>three</p>');
  });

  test('links local parts to their page here and others outside', () => {
    const out = html(
      '[BBa_B0015](https://synbiohub.org/public/igem/BBa_B0015/1) and [x](https://example.org/x)'
    );
    expect(out).toContain('href="/public/igem/BBa_B0015/1"');
    expect(out).toContain(
      '<a href="https://example.org/x" target="_blank" rel="noreferrer noopener">x</a>'
    );
  });

  test('shows HTML and script links from the model as text', () => {
    const out = html(
      '<img src=x onerror=alert(1)> [click](javascript:alert(1))'
    );
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<a');
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  test('shows table rows without the separator row', () => {
    const out = html('| id | bp |\n|---|---|\n| BBa_B0015 | 129 |');
    expect(out.match(/<span>/g)).toHaveLength(4);
    expect(out).not.toContain('---');
  });
});
