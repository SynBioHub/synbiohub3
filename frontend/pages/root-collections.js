import { useState } from 'react';

import NavbarSearch from '../components/SearchComponents/NavbarSearch/NavbarSearch';
import SearchHeader from '../components/SearchComponents/SearchHeader/SearchHeader';
import ResultTable from '../components/SearchComponents/StandardSearch/ResultTable/ResultTable';
import TopLevel from '../components/TopLevel';
import styles from '../styles/standardsearch.module.css';

/**
 * This page renders the default search for the /search url
 */
export default function RootCollections({ data }) {
  const [query, setQuery] = useState('');

  return (
    <TopLevel
      navbar={
        <NavbarSearch
          value={query}
          placeholder="Filter root collections"
          onChange={event => {
            setQuery(event.target.value);
          }}
        />
      }
      hideFooter={true}
      publicPage={true}
    >
      <div className={styles.container}>
        <SearchHeader selected="Root Collections" data={data} />
        <div className={styles.standardcontainer}>
          <ResultTable
            count={data.length}
            data={data}
            overrideType="Collection"
          />
        </div>
      </div>
    </TopLevel>
  );
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export async function getServerSideProps() {
  // Fetch rootCollections from sbh
  const url = `${process.env.backendUrl}/rootCollections`;
  const headers = {
    Accept: 'text/plain; charset=UTF-8'
  };

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  const data = await response.json();

  return { props: { data } };
}
