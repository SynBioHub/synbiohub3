import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import dynamic from 'next/dynamic';
import getConfig from 'next/config';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';

import Table from '../components/Reusable/Table/Table';
import SearchHeader from '../components/Search/SearchHeader/SearchHeader';
import {
  isSparqlUpdate,
  processSparqlResults,
  REGULAR_GRAPH_OPTIONS,
  resolveSelectedGraphUri,
  SPARQL_PREFIXES
} from '../components/Sparql/sparqlShared';
import TopLevel from '../components/TopLevel';
import styles from '../styles/sparql.module.css';

const { publicRuntimeConfig } = getConfig();

const CodeMirror = dynamic(
  () => {
    import('codemirror/mode/sparql/sparql');
    import('codemirror/lib/codemirror.css');
    return import('../components/Search/Sparql/CodeMirror');
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
  const [graphSelection, setGraphSelection] = useState(REGULAR_GRAPH_OPTIONS[0]);

  const token = useSelector(state => state.user.token);
  const loggedIn = useSelector(state => state.user.loggedIn);
  const userGraphUri = useSelector(state => state.user.graphUri);
  const theme = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('theme')) || {};
    } catch {
      return {};
    }
  }, []);
  const defaultGraph = theme.defaultGraph || '';

  const selectedGraphUri = resolveSelectedGraphUri(graphSelection?.value, {
    defaultGraph,
    userGraphUri
  });

  const onGraphChange = useCallback(
    option => {
      if (option?.value === 'user' && !loggedIn) {
        setError('Sign in to query My Submissions.');
        return;
      }
      setGraphSelection(option);
      setError();
    },
    [loggedIn]
  );

  return (
    <TopLevel doNotTrack={true} hideFooter={true} publicPage={true}>
      <div className={styles.container}>
        <SearchHeader selected="SPARQL" />
        <div className={styles.standardcontainer}>
          <CodeMirror query={query} setQuery={setQuery} />
          <div className={styles.controls}>
            <div className={styles.graphselect}>
              <label>Graph</label>
              <Select
                options={REGULAR_GRAPH_OPTIONS}
                value={graphSelection}
                onChange={onGraphChange}
                className={styles.optionselect}
                placeholder="Graph"
                id="graph-value-select"
                instanceId="graph-value-select"
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
                  graphSelection: graphSelection?.value,
                  loggedIn,
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
          {graphSelection?.value === 'user' && selectedGraphUri && (
            <div className={styles.selectedGraphUri}>{selectedGraphUri}</div>
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
    </TopLevel>
  );
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
  graphSelection,
  loggedIn,
  setLoading,
  setResults,
  setHeaders,
  setError
}) => {
  setError();
  if (isSparqlUpdate(query)) {
    setError(
      'The public SPARQL endpoint is read-only. Use Admin → SPARQL for INSERT/DELETE/UPDATE.'
    );
    return;
  }
  if (graphSelection === 'user' && !loggedIn) {
    setError('Sign in to query My Submissions.');
    return;
  }
  if (graphSelection === 'user' && !graphUri) {
    setError('Your user graph is not available yet. Try refreshing after sign-in.');
    return;
  }

  setLoading(true);
  const params = new URLSearchParams();
  params.set('query', query);
  if (graphUri) params.set('default-graph-uri', graphUri);

  const url = `${publicRuntimeConfig.backend}/sparql?${params.toString()}`;
  const headers = {
    Accept: 'application/json'
  };
  if (token) headers['X-authorization'] = token;

  let response;
  try {
    response = await axios.get(url, { headers });
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
    setResults(processSparqlResults(body));
    setHeaders(body.head?.vars || []);
  } else {
    setError(response ? response.data : 'Unknown error');
    setResults();
  }
  setLoading(false);
};
