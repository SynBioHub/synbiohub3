import axios from 'axios';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import {
  countloader,
  countloadercontainer,
  standardcontainer,
  standarderror,
  standardresultsloading
} from '../../../styles/standardsearch.module.css';
import ResultTable from './ResultTable/ResultTable';

/**
 * This component handles a basic 'string search' from users on sbh,
 * otherwise known as a standard search
 */
export default function StandardSearch() {
  const query = useSelector(state => state.search.query);
  const offset = useSelector(state => state.search.offset);
  const limit = useSelector(state => state.search.limit);
  const token = useSelector(state => state.user.token);
  const [count, setCount] = useState();

  // get search count
  const { newCount, isCountLoading, isCountError } = useSearchCount(
    query,
    token
  );

  // update search count display
  useEffect(() => {
    if (isCountLoading) {
      setCount(
        <div className={countloadercontainer}>
          <Loader
            className={countloader}
            color="#D25627"
            height={10}
            type="ThreeDots"
            width={25}
          />
        </div>
      );
    }
    if (isCountError) {
      setCount('Error');
    } else {
      setCount(newCount);
    }
  }, [isCountLoading, isCountError, query]);

  // get search results
  const { results, isLoading, isError } = useSearchResults(
    query,
    offset,
    limit,
    token
  );

  if (isError) {
    return (
      <div className={standarderror}>
        Errors were encountered while fetching the data count
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className={standardcontainer}>
        <div className={standardresultsloading}>
          <Loader color="#D25627" type="ThreeDots" />
        </div>
      </div>
    );
  }
  if (results.length === 0) {
    return <div className={standarderror}>No results found</div>;
  }
  return (
    <div className={standardcontainer}>
      <ResultTable count={count} data={results} />
    </div>
  );
}

const useSearchResults = (query, offset, limit, token) => {
  const { data, error } = useSWR(
    [
      `${process.env.backendUrl}/search/${query}?offset=${offset}&limit=${limit}`,
      token
    ],
    fetcher
  );

  return {
    results: data,
    isLoading: !error && !data,
    isError: error
  };
};

const useSearchCount = (query, token) => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/searchCount/${query}`, token],
    fetcher
  );

  return {
    newCount: data,
    isCountLoading: !error && !data,
    isCountError: error
  };
};

const fetcher = (url, token) =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
    .then(response => response.data);
