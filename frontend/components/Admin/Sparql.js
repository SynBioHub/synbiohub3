import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import dynamic from 'next/dynamic';
import getConfig from 'next/config';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';

import styles from '../../styles/sparql.module.css';
import Table from '../Reusable/Table/Table';
import GraphPickerModal from '../Sparql/GraphPickerModal';
import {
  ADMIN_GRAPH_OPTIONS,
  processSparqlResults,
  resolveSelectedGraphUri,
  SPARQL_PREFIXES
} from '../Sparql/sparqlShared';

const { publicRuntimeConfig } = getConfig();

const CodeMirror = dynamic(
  () => {
    import('codemirror/mode/sparql/sparql');
    import('codemirror/lib/codemirror.css');
    return import('../Search/Sparql/CodeMirror');
  },
  { ssr: false }
);

/* eslint unicorn/prefer-module: "off" */

export default function SPARQL() {
  const [query, setQuery] = useState(SPARQL_PREFIXES);
  const [results, setResults] = useState();
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [graphSelection, setGraphSelection] = useState(ADMIN_GRAPH_OPTIONS[0]);
  const [customGraphUri, setCustomGraphUri] = useState('');
  const [showGraphModal, setShowGraphModal] = useState(false);

  const token = useSelector(state => state.user.token);
  const userGraphUri = useSelector(state => state.user.graphUri);
  const theme = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('theme')) || {};
    } catch {
      return {};
    }
  }, []);
  const defaultGraph = theme.defaultGraph || '';
  const uriPrefix = theme.uriPrefix || '';

  const graphOptions = useMemo(() => {
    if (!customGraphUri) return ADMIN_GRAPH_OPTIONS;
    return [
      ADMIN_GRAPH_OPTIONS[0],
      ADMIN_GRAPH_OPTIONS[1],
      { value: customGraphUri, label: shortenGraphLabel(customGraphUri) },
      ADMIN_GRAPH_OPTIONS[2]
    ];
  }, [customGraphUri]);

  const selectValue = useMemo(() => {
    if (customGraphUri) {
      return { value: customGraphUri, label: shortenGraphLabel(customGraphUri) };
    }
    return graphSelection;
  }, [customGraphUri, graphSelection]);

  const selectedGraphUri = customGraphUri
    ? customGraphUri
    : resolveSelectedGraphUri(graphSelection?.value, {
        defaultGraph,
        userGraphUri
      });

  const fetchGraphs = useCallback(
    async listQuery => {
      const params = new URLSearchParams();
      params.set('query', listQuery);
      // Omit default-graph-uri so Virtuoso can see named graphs (SBH1 admin API).
      const url = `${publicRuntimeConfig.backend}/admin/sparql?${params.toString()}`;
      const response = await axios.get(url, {
        headers: {
          Accept: 'application/json',
          'X-authorization': token
        }
      });
      if (response.status !== 200) {
        throw new Error(
          typeof response.data === 'string' ? response.data : 'Failed to list graphs'
        );
      }
      return response.data;
    },
    [token]
  );

  const onGraphChange = option => {
    if (!option) return;
    if (option.value === 'all') {
      setShowGraphModal(true);
      return;
    }
    if (option.value === 'public' || option.value === 'user') {
      setCustomGraphUri('');
      setGraphSelection(option);
    } else {
      // Concrete URI chosen from the dropdown (previously picked via modal).
      setCustomGraphUri(option.value);
    }
    setError();
  };

  return (
    <div className={styles.container}>
      {showGraphModal && (
        <GraphPickerModal
          onClose={() => setShowGraphModal(false)}
          onSelect={uri => {
            setCustomGraphUri(uri);
            setGraphSelection(ADMIN_GRAPH_OPTIONS[2]);
            setShowGraphModal(false);
            setError();
          }}
          fetchGraphs={fetchGraphs}
          uriPrefix={uriPrefix}
          defaultGraph={defaultGraph}
        />
      )}
      <div className={styles.standardcontainer}>
        <CodeMirror query={query} setQuery={setQuery} />
        <div className={styles.controls}>
          <div className={styles.graphselect}>
            <label>Graph</label>
            <Select
              options={graphOptions}
              value={selectValue}
              onChange={onGraphChange}
              className={styles.optionselect}
              placeholder="Graph"
              id="admin-graph-value-select"
              instanceId="admin-graph-value-select"
              menuPortalTarget={
                typeof window !== 'undefined' ? document.body : undefined
              }
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
          <div
            className={styles.submitquery}
            role="button"
            onClick={() =>
              submitQuery({
                query,
                graphUri: selectedGraphUri,
                token,
                setLoading,
                setResults,
                setHeaders,
                setError
              })
            }
          >
            <FontAwesomeIcon
              icon={faDatabase}
              size="1x"
              className={styles.dnaicon}
              color="#F2E86D"
            />
            Submit Query
          </div>
        </div>
        {selectedGraphUri && (
          <div className={styles.selectedGraphUri}>
            Active graph: {selectedGraphUri}
            {customGraphUri && (
              <>
                {' '}
                <button
                  type="button"
                  className={styles.link}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setShowGraphModal(true)}
                >
                  Change…
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {error && <div className={styles.errormessage}>{error}</div>}
      {results && (
        <div className={styles.tablecontainer}>
          <Table
            data={results}
            loading={loading}
            title="Results"
            searchable={headers}
            headers={headers}
            dataRowDisplay={result => createRowDisplay(headers, result)}
            hideFooter={false}
            hideFilter={true}
            scrollX={true}
          />
        </div>
      )}
    </div>
  );
}

function shortenGraphLabel(uri) {
  const user = String(uri).match(/\/user\/([^/]+)/);
  if (user) return `user/${decodeURIComponent(user[1])}`;
  if (uri.length > 40) return `…${uri.slice(-36)}`;
  return uri;
}

const createRowDisplay = (headers, result) => {
  const resultData = headers.map((header, index) => {
    if (result[header] && result[header].type === 'uri')
      return (
        <td key={index}>
          <a href={result[header].value} className={styles.link}>
            {result[header].value}
          </a>
        </td>
      );
    return (
      <td key={index}>
        {result[header] ? result[header].value ?? result[header] : ''}
      </td>
    );
  });
  return <tr>{resultData}</tr>;
};

const submitQuery = async ({
  query,
  graphUri,
  token,
  setLoading,
  setResults,
  setHeaders,
  setError
}) => {
  setError();
  setLoading(true);

  const parameters = new URLSearchParams();
  parameters.append('query', query);
  if (graphUri) parameters.append('default-graph-uri', graphUri);

  // POST keeps large queries out of the URL; Accept: application/json hits the
  // SBH1 API path (not the HTML view that enumerates/counts every graph).
  const url = `${publicRuntimeConfig.backend}/admin/sparql`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-authorization': token
  };

  let response;
  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    const message =
      (error.response &&
        (typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data?.message)) ||
      error.message ||
      'Unknown error';
    setError(message);
    setResults();
    setLoading(false);
    return;
  }

  if (response && response.status === 200) {
    setError();
    const body = response.data;
    // SBH1 updateQueryJson sometimes returns a flattened array; normalize.
    if (body && body.head && body.results) {
      setResults(processSparqlResults(body));
      setHeaders(body.head.vars || []);
    } else if (Array.isArray(body)) {
      const keys = body.length > 0 ? Object.keys(body[0]) : [];
      setHeaders(keys);
      setResults(
        body.map(row => {
          const obj = {};
          for (const key of keys) {
            const val = row[key];
            obj[key] =
              val && typeof val === 'object' && 'value' in val
                ? val
                : { type: 'literal', value: val == null ? '' : String(val) };
          }
          return obj;
        })
      );
    } else if (typeof body === 'string' && body.trim()) {
      // Update with empty JSON results — treat as success message.
      setResults();
      setHeaders([]);
      setError();
      alert(body.length < 500 ? body : 'Update completed.');
    } else {
      setResults([]);
      setHeaders([]);
    }
  } else {
    setError(response ? response.data : 'Unknown error');
    setResults();
  }
  setLoading(false);
};
