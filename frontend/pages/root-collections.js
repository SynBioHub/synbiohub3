import getConfig from 'next/config';
import { useEffect, useState } from 'react';

import NavbarSearch from '../components/Search/NavbarSearch/NavbarSearch';
import SearchHeader from '../components/Search/SearchHeader/SearchHeader';
import ResultTable from '../components/Search/StandardSearch/ResultTable/ResultTable';
import TopLevel from '../components/TopLevel';
import styles from '../styles/standardsearch.module.css';
import { addError } from '../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
// const { publicRuntimeConfig } = getConfig();
import backendUrl from '../components/GetUrl/GetBackend';

/**
 * This page renders the default search for the /search url
 */
export default function RootCollections() {
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${backendUrl}/rootCollections`;
        const headers = {
          Accept: 'text/plain; charset=UTF-8',
          'X-authorization': token
        };

        const response = await axios.get(url, { headers });

        if (!response || !response.data) {
          throw new Error("Failed to retrieve data from server");
        }

        setData(response.data);
        setFilteredData(response.data); // Set initial filtered data
      } catch (err) {
        console.error('Error:', err.message);
        setError({
          customMessage: 'Request and/or processing failed for GET /rootCollections',
          fullUrl: `${backendUrlSS}/rootCollections`,
          message: err.message,
          name: 'Client side error',
          stack: err.stack
        });
        dispatch(addError(err)); // Dispatch the error
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (data) {
      const newFilteredData = data.filter(result => {
        for (const key of Object.keys(result)) {
          if (result[key] !== null && result[key] !== undefined && query !== undefined && result[key].toString().toLowerCase().includes(query.toLowerCase()))
            return true;
        }
        return false;
      });
      setFilteredData(newFilteredData);
    }
  }, [data, query]);


  if (error) {
    // Render error message or handle error as needed
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    // Render loading state
    return <div>Loading...</div>;
  }

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

