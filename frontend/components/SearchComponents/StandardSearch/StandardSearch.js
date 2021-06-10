import axios from 'axios';
import { useRouter } from 'next/router';
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
  const token = useSelector(state => state.user.token);
  const [count, setCount] = useState();
  const searchUrl = constructUrl('search', query, offset);
  const countUrl = constructUrl('searchCount', query);

  const router = useRouter();

  // push url to browser history when search changes
  useEffect(() => {
    if (query || offset) router.push(searchUrl, undefined, { shallow: true });
  }, [searchUrl]);

  // get search count
  const { newCount, isCountLoading, isCountError } = useSearchCount(
    countUrl,
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
  const { results, isLoading, isError } = useSearchResults(searchUrl, token);

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
          <Loader color="#D25627" type="Grid" />
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

const useSearchResults = (url, token) => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}${url}`, token],
    fetcher
  );

  return {
    results: data,
    isLoading: !error && !data,
    isError: error
  };
};

const useSearchCount = (url, token) => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}${url}`, token],
    fetcher
  );

  return {
    newCount: data,
    isCountLoading: !error && !data,
    isCountError: error
  };
};

const constructUrl = (type, query, offset, limit) => {
  var baseUrl = `/${type}/${query}`;
  if (offset) {
    baseUrl += `?offset=${offset}`;
  }
  if (limit) {
    baseUrl += `&limit=${limit}`;
  }

  return baseUrl;
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
