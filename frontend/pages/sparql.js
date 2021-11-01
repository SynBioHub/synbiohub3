import 'codemirror/lib/codemirror.css';

import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import Select from 'react-select';

import SearchHeader from '../components/SearchComponents/SearchHeader/SearchHeader';
import TopLevel from '../components/TopLevel';
import styles from '../styles/sparql.module.css';

let CodeMirror = null;
if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
  CodeMirror = require('react-codemirror2').UnControlled;
  require('codemirror/mode/sparql/sparql');
}

/* eslint unicorn/prefer-module: "off" */

export default function SPARQL() {
  const [query, setQuery] = useState(startQuery);

  return (
    <TopLevel doNotTrack={true} hideFooter={true} publicPage={true}>
      <div className={styles.container}>
        <SearchHeader selected="SPARQL" />
        <div className={styles.standardcontainer}>
          {CodeMirror && (
            <CodeMirror
              value={query}
              options={{
                mode: 'sparql',
                lineNumbers: true
              }}
              width="10px"
              onChange={(editor, data, value) => {
                setQuery(value);
              }}
            />
          )}
          <div className={styles.controls}>
            <div className={styles.graphselect}>
              <label>Graph</label>
              <Select
                options={graphs}
                defaultValue={graphs[0]}
                className={styles.optionselect}
                placeholder="Graph"
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
            <div className={styles.submitquery} role="button">
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
      </div>
    </TopLevel>
  );
}

/*
const submitQuery = async (query) => {
  const url = `${process.env.backendUrl}/sparql?query=${encodeURIComponent(query)}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (response.status === 200) {
    const results = await response.json();
  }
}
*/

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

`;
