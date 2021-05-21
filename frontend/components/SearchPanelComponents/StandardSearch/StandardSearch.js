import useSWR from 'swr';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

import Loader from 'react-loader-spinner';
import { useDispatch, useSelector } from 'react-redux';
import ResultTable from './ResultTable/ResultTable';
import {
  countloader, countloadercontainer, standardcontainer, standarderror, standardresultsloading,
} from '../../../styles/searchpanel.module.css';
import { setOffset } from '../../../redux/actions';

/**
 * This component handles a basic 'string search' from users on sbh,
 * otherwise known as a standard search
 */
export default function StandardSearch() {
  const query = useSelector((state) => state.search.query);
  const offset = useSelector((state) => state.search.offset);
  const token = useSelector((state) => state.user.token);
  const dispatch = useDispatch();
  const [
    firstQuery,
    setFirstQuery,
  ] = useState(true);
  const hasQueryChanged = useCompare(query);
  const [
    count,
    setCount,
  ] = useState(undefined);
  const { newCount, isCountLoading, isCountError } = getSearchCount(query, offset, token);

  useEffect(() => {
    if (hasQueryChanged && !firstQuery) {
      dispatch(setOffset(0));
    }
    setFirstQuery(false);
    if (isCountLoading) {
      setCount(<div className={countloadercontainer}>
        <Loader
          className={countloader}
          color="#D25627"
          height={10}
          type="ThreeDots"
          width={25}
        />
      </div>);
    }
    if (isCountError) {
      setCount('Error');
    } else {
      setCount(newCount);
    }
  }, [
    query,
    hasQueryChanged,
    newCount,
    isCountLoading,
    isCountError,
  ]);

  const { results, isLoading, isError } = getSearchResults(query, offset, token);

  if (isError) {
    return <div className={standarderror}>Errors were encountered while fetching the data count</div>;
  }
  if (isLoading) {
    return (
      <div className={standardcontainer}>
        <div className={standardresultsloading}>
          <Loader
            color="#D25627"
            type="Grid"
          />
        </div>
      </div>
    );
  }
  if (results.length === 0) {
    return <div className={standarderror}>No results found</div>;
  }
  console.log(results)
  return (
    <div className={standardcontainer}>
      <ResultTable
        count={count}
        data={results}
      />
    </div>
  );
}

const getSearchResults = (query, offset, token) => {
  const { data, error } = useSWR([`${process.env.backendUrl}/search/${query}?offset=${offset}`, token], fetcher);

  return {
    results: data,
    isLoading: !error && !data,
    isError: error,
  };
};

const getSearchCount = (query, offset, token) => {
  const { data, error } = useSWR([`${process.env.backendUrl}/searchCount/${query}?offset=${offset}`, token], fetcher);

  return {
    newCount: data,
    isCountLoading: !error && !data,
    isCountError: error,
  };
};

const fetcher = (url, token) => axios.get(url, {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'text/plain',
    'X-authorization': token,
  },
}).then((res) => res.data);

// Used to compare new query to previous query
function useCompare(val) {
  const prevVal = usePrevious(val);

  return prevVal !== val;
}

// Helper hook
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
