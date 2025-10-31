import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Select from 'react-select';
import feConfig from "../config.json"

import Table from '../components/Reusable/Table/Table';
import SearchHeader from '../components/Search/SearchHeader/SearchHeader';
import TopLevel from '../components/TopLevel';
import styles from '../styles/sparql.module.css';

import axios from 'axios';

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
  const [query, setQuery] = useState(startQuery);

  const [results, setResults] = useState();
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

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
                options={graphs}
                defaultValue={graphs[0]}
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
                submitQuery(query, setLoading, setResults, setHeaders, setError)
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
    if (result[header].type === 'uri')
      return (
        <td key={index}>
          <a href={result[header].value} className={styles.link}>
            {result[header].value}
          </a>
        </td>
      );
    return <td key={index}>{result[header].value}</td>;
  });
  return <tr>{resultData}</tr>;
};

const submitQuery = async (
  query,
  setLoading,
  setResults,
  setHeaders,
  setError
) => {
  setError();
  setLoading(true);
  const url = `${feConfig.backend}/sparql?query=${encodeURIComponent(
    query
  )}`;

  const headers = {
    // 'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  let response;

  try {
    response = await axios.get(url, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  if (response && response.status === 200) {
    setError();
    const results = response.data;
    setResults(processResults(results));
    setHeaders(results.head.vars);
} else {
    const message = response ? response.data : 'Unknown error';
    setError(message);
    setResults();
}

  setLoading(false);
};

const processResults = results => {
  // if (!results.results || !results.results.bindings) {
  //   return [];
  // }
  const headers = results.head.vars;
  return results.results.bindings.map(result => {
    const resultObject = {};
    for (const header of headers) {
      if (result[header]) resultObject[header] = result[header];
      else resultObject[header] = '';
    }
    return resultObject;
  });
};

const graphs = [
  { value: 'Public', label: 'Public' },
  { value: 'User', label: 'My Submissions' }
];

const startQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sbol: <http://sbols.org/v2#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX purl: <http://purl.obolibrary.org/obo/>
PREFIX biopax: <http://www.biopax.org/release/biopax-level3.owl#>
PREFIX so: <http://identifiers.org/so/>
PREFIX bench: <http://wiki.synbiohub.org/wiki/Terms/benchling#>
PREFIX genbank: <http://www.ncbi.nlm.nih.gov/genbank#>

`;
