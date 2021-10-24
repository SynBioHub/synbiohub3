import 'codemirror/lib/codemirror.css';

import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import Select from 'react-select';

import SearchHeader from '../components/SearchComponents/SearchHeader/SearchHeader';
import TopLevel from '../components/TopLevel';
import styles from '../styles/sparql.module.css';

/* eslint unicorn/prefer-module: "off" */

export default function SPARQL() {
  if (document.createElement) require('codemirror/mode/sparql/sparql');
  const [query, setQuery] = useState(
    `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX sbh: <http://wiki.synbiohub.org/wiki/Terms/synbiohub#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sbol: <http://sbols.org/v2#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX purl: <http://purl.obolibrary.org/obo/>

`
  );

  return (
    <TopLevel doNotTrack={true} hideFooter={true} publicPage={true}>
      <div className={styles.container}>
        <SearchHeader selected="SPARQL" />
        <div className={styles.standardcontainer}>
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
          <div className={styles.controls}>
            <div className={styles.graphselect}>
              <label>Graph</label>
              <Select
                options={graphs}
                defaultValue={graphs[0]}
                className={styles.optionselect}
                placeholder="Graph"
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
            <div className={styles.submitquery}>
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

const graphs = [
  { value: 'Public', label: 'Public' },
  { value: 'User', label: 'My Submissions' }
];
