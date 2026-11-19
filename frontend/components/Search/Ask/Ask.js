import axios from 'axios';
import getConfig from 'next/config';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';

import styles from '../../../styles/ask.module.css';

const { publicRuntimeConfig } = getConfig();

const EXAMPLES = [
  'What is BBa_B0015 and which designs use it?',
  'How many terminators are shorter than 50 bp?',
  'Which promoters are used in the most devices?'
];

/**
 * Ask a question in plain language. SynBioHub forwards it to SBOLExplorer's
 * /ask, where Claude answers from GraphRAG retrieval and read-only SPARQL over
 * the public data. Each tool call is listed under the answer.
 */
export default function Ask() {
  const token = useSelector(state => state.user.token);
  const loggedIn = useSelector(state => state.user.loggedIn);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState();
  const [problem, setProblem] = useState();
  const [loading, setLoading] = useState(false);

  const submit = async text => {
    const asked = text.trim();
    if (!asked || loading) return;
    setQuestion(asked);
    setLoading(true);
    setResult();
    setProblem();
    try {
      const response = await axios.post(
        `${publicRuntimeConfig.backend}/ask`,
        { question: asked },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-authorization': token
          }
        }
      );
      setResult(response.data);
    } catch (error) {
      setProblem(describeError(error));
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.hint}>
          <Link href="/login?next=/ask">Log in</Link> to ask questions about the
          parts in this SynBioHub.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault();
          submit(question);
        }}
      >
        <textarea
          className={styles.input}
          value={question}
          rows={3}
          placeholder="Ask about parts, devices or collections, e.g. which terminators are shorter than 50 bp?"
          onChange={event => setQuestion(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit(question);
            }
          }}
        />
        <button
          className={styles.button}
          type="submit"
          disabled={loading || !question.trim()}
        >
          Ask
        </button>
      </form>

      {!result && !loading && !problem && (
        <div className={styles.examples}>
          <span>Try:</span>
          {EXAMPLES.map(example => (
            <button
              key={example}
              className={styles.example}
              type="button"
              onClick={() => submit(example)}
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <Loader color="#D25627" type="ThreeDots" />
          <span>
            Searching the repository and writing an answer; this can take up to
            a minute.
          </span>
        </div>
      )}

      {problem && <div className={styles.error}>{problem}</div>}

      {result && (
        <div className={styles.result}>
          <div className={styles.answer}>
            <Markdown text={result.answer} />
          </div>
          <p className={styles.disclaimer}>
            Written by an AI model ({result.model}) from this repository&apos;s
            public data. Check the linked parts before relying on it.
          </p>
          {result.steps && result.steps.length > 0 && (
            <Steps steps={result.steps} />
          )}
        </div>
      )}
    </div>
  );
}

function describeError(error) {
  const status = error.response && error.response.status;
  if (status === 401)
    return 'Your session has ended. Log in again to ask questions.';
  if (status === 501 || status === 503) {
    return 'Ask is not available: it is turned off in SBOLExplorer on this SynBioHub.';
  }
  if (status === 502) return 'SBOLExplorer is not responding. Try again later.';
  const message =
    error.response && error.response.data && error.response.data.error;
  return `The question could not be answered${message ? `: ${message}` : '.'}`;
}

/** The tool calls behind an answer, each expandable to its input and output. */
function Steps({ steps }) {
  return (
    <div className={styles.steps}>
      <h3 className={styles.stepsTitle}>
        How this was answered ({steps.length} lookups)
      </h3>
      {steps.map((step, index) => (
        <details key={index} className={styles.step}>
          <summary>
            <span className={step.error ? styles.stepError : styles.stepName}>
              {TOOL_LABELS[step.tool] || step.tool}
            </span>
            <span className={styles.stepSummary}>{stepSummary(step)}</span>
            <span className={styles.stepTime}>{step.seconds}s</span>
          </summary>
          <div className={styles.stepLabel}>Input</div>
          <pre className={styles.pre}>
            {step.tool === 'sparql_query'
              ? step.input.query
              : JSON.stringify(step.input, null, 2)}
          </pre>
          <div className={styles.stepLabel}>Output</div>
          <pre className={styles.pre}>{step.output}</pre>
        </details>
      ))}
    </div>
  );
}

const TOOL_LABELS = {
  graphrag_retrieve: 'Graph search',
  sparql_query: 'SPARQL'
};

function stepSummary(step) {
  const text =
    step.tool === 'sparql_query' ? step.input.query : step.input.question;
  const oneLine = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  return oneLine.length > 90 ? `${oneLine.slice(0, 90)}…` : oneLine;
}

/**
 * Minimal Markdown for answers: paragraphs, bullet and numbered lists,
 * headings, tables shown as text, **bold**, `code` and [links](url). Builds
 * React elements, never HTML, so model output cannot inject markup.
 */
export function Markdown({ text }) {
  return parseBlocks(text).map((block, index) => renderBlock(block, index));
}

// One line of the answer: a list item, heading, table row, blank or text
function classify(line) {
  const item = line.match(/^\s*(?:([*-])|\d+[).])\s+(.*)$/);
  if (item) return { kind: item[1] ? 'ul' : 'ol', text: item[2] };
  const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
  if (heading) return { kind: 'h', text: heading[1] };
  const trimmed = line.trim();
  if (trimmed.startsWith('|')) {
    // a |---|---| separator row adds nothing to rows shown as text
    const separator = /^\|[\s:|-]+\|$/.test(trimmed);
    return { kind: separator ? 'blank' : 'row', text: trimmed };
  }
  return { kind: trimmed ? 'text' : 'blank', text: trimmed };
}

// Groups lines into blocks: consecutive text lines form a paragraph and
// consecutive items of one kind form a list
function parseBlocks(text) {
  const blocks = [];
  for (const line of String(text || '').split('\n')) {
    const { kind, text: content } = classify(line);
    const last = blocks[blocks.length - 1];
    if (kind === 'blank') {
      blocks.push({ type: 'blank' });
    } else if ((kind === 'ul' || kind === 'ol') && last && last.type === kind) {
      last.items.push(content);
    } else if (kind === 'ul' || kind === 'ol') {
      blocks.push({ type: kind, items: [content] });
    } else if (kind === 'text' && last && last.type === 'p') {
      last.text += ` ${content}`;
    } else {
      blocks.push({ type: kind === 'text' ? 'p' : kind, text: content });
    }
  }
  return blocks.filter(block => block.type !== 'blank');
}

function renderBlock(block, index) {
  if (block.type === 'ul' || block.type === 'ol') {
    const ListTag = block.type;
    return (
      <ListTag key={index}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{inline(item)}</li>
        ))}
      </ListTag>
    );
  }
  if (block.type === 'h') return <h4 key={index}>{inline(block.text)}</h4>;
  if (block.type === 'row') {
    const cells = block.text.replace(/^\||\|$/g, '').split('|');
    return (
      <div key={index} className={styles.row}>
        {cells.map((cell, cellIndex) => (
          <span key={cellIndex}>{inline(cell.trim())}</span>
        ))}
      </div>
    );
  }
  return <p key={index}>{inline(block.text)}</p>;
}

const INLINE = /\[([^\]]+)]\(([^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

function inline(text) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = match.index;
    if (match[1])
      parts.push(<PartLink key={key} href={match[2]} label={match[1]} />);
    else if (match[3]) parts.push(<strong key={key}>{match[3]}</strong>);
    else parts.push(<code key={key}>{match[4]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((part, index) =>
    typeof part === 'string' ? (
      <Fragment key={`t${index}`}>{part}</Fragment>
    ) : (
      part
    )
  );
}

/** Links a part URI to its page here when it belongs to this SynBioHub. */
function PartLink({ href, label }) {
  if (!/^https?:\/\//.test(href)) return <>{label}</>;
  const local = localPath(href);
  if (local) return <Link href={local}>{label}</Link>;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {label}
    </a>
  );
}

function localPath(uri) {
  let registries = [];
  try {
    registries = JSON.parse(localStorage.getItem('registries')) || [];
  } catch {
    registries = [];
  }
  if (!Array.isArray(registries)) return;
  for (const registry of registries) {
    if (
      registry.uri &&
      uri.startsWith(registry.uri) &&
      registry.url === publicRuntimeConfig.backend
    ) {
      return uri.slice(registry.uri.length) || '/';
    }
  }
}
