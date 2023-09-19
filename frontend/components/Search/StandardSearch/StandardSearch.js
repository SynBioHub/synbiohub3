import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
const { publicRuntimeConfig } = getConfig();

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
  const dispatch = useDispatch();

  // get search count
  const { newCount, isCountLoading, isCountError } = useSearchCount(
    encodeURIComponent(query),
    token,
    dispatch
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
    encodeURIComponent(query),
    offset,
    limit,
    token,
    dispatch
  );

  if (isError) {
    return (
      <div className={standarderror}>
        Errors were encountered while fetching the data
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
  for (const result of results) {
    getTypeAndUrl(result);
  }
  return (
    <div className={standardcontainer}>
      <ResultTable count={count} data={results} />
    </div>
  );
}

const useSearchResults = (query, offset, limit, token, dispatch) => {
  const { data, error } = useSWR(
    [
      `${publicRuntimeConfig.backend}/search/${query}?offset=${offset}&limit=${limit}`,
      token,
      dispatch
    ],
    fetcher
  );

  return {
    results: data,
    isLoading: !error && !data,
    isError: error
  };
};

const useSearchCount = (query, token, dispatch) => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/searchCount/${query}`, token, dispatch],
    fetcher
  );

  return {
    newCount: data,
    isCountLoading: !error && !data,
    isCountError: error
  };
};

const getTypeAndUrl = result => {
  let type = '';
  const potentialType = result.type.toLowerCase();

  // Identify what type of object the search result is from type url
  if (potentialType.includes('component')) {
    type = 'Component';
  }
  if (potentialType.includes('sequence')) {
    type = 'Sequence';
  }
  if (potentialType.includes('module')) {
    type = 'Module';
  }
  if (potentialType.includes('collection')) {
    type = 'Collection';
  }

  result.type = type;

  let newUrl = result.uri.replace('https://synbiohub.org', '');
  newUrl = newUrl.replace('https://dev.synbiohub.org', '');
  result.url = newUrl;
};

const fetcher = (url, token, dispatch) =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
    .then(response => response.data)
    .catch(error => {
      error.customMessage =
        'Request failed while fetching search result-related data';
      error.fullUrl = url;
      dispatch(addError(error));
    });
