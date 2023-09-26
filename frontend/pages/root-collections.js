import getConfig from 'next/config';
import { useEffect, useState } from 'react';

import NavbarSearch from '../components/Search/NavbarSearch/NavbarSearch';
import SearchHeader from '../components/Search/SearchHeader/SearchHeader';
import ResultTable from '../components/Search/StandardSearch/ResultTable/ResultTable';
import TopLevel from '../components/TopLevel';
import styles from '../styles/standardsearch.module.css';
import { addError } from '../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
const { publicRuntimeConfig } = getConfig();

/**
 * This page renders the default search for the /search url
 */
export default function RootCollections({ data, error }) {
  const dispatch = useDispatch();
  if (error) {
    dispatch(addError(error));
  }
  const [query, setQuery] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    const newFilteredData = data.filter(result => {
      for (const key of Object.keys(result))
        if (result[key].toString().toLowerCase().includes(query.toLowerCase()))
          return true;
      return false;
    });
    setFilteredData(newFilteredData);
  }, [data, query]);

  return (
    <TopLevel
      doNotTrack={true}
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
            count={filteredData.length}
            data={filteredData}
            overrideType="Collection"
          />
        </div>
      </div>
    </TopLevel>
  );
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export async function getServerSideProps() {
  // const token = useSelector(state => state.user.token);
  // const token = context.store.getState().user.token; 
  // Fetch rootCollections from sbh
  try {
    const url = `${publicRuntimeConfig.backendSS}/rootCollections`;
    const headers = {
      Accept: 'text/plain; charset=UTF-8'
    };

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    const data = await response.json();

    return { props: { data } };
  } catch (error) {
    return {
      props: {
        error: {
          customMessage:
            'Request and/or processing failed for GET /rootCollections',
          fullUrl: `${publicRuntimeConfig.backendSS}/rootCollections`,
          message: error.message,
          name: 'Server side error',
          stack: error.stack
        },
        data: []
      }
    };
  }
}
