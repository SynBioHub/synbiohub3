import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { addError } from '../../../redux/actions';

const { publicRuntimeConfig } = getConfig();

// sorts options by facet count (highest first), then alphabetically by label
export const sortByCount = data =>
  data.sort((a, b) => {
    const countDiff = (b.count || 0) - (a.count || 0);
    if (countDiff !== 0) return countDiff;
    return (a.label || '')
      .toString()
      .toLowerCase()
      .localeCompare((b.label || '').toString().toLowerCase());
  });

/**
 * Fetches (or parses an already-fetched) SPARQL facet result set into
 * { loading, error, data } for a facet's option list. Shared by FacetCard
 * and AdditionalFilter.
 */
export default function useFacetOptions({ sparql, parseResult, result }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    if (!sparql && !result) {
      setData([]);
      setLoading(false);
      return;
    }
    if (!result) {
      fetchOptions(
        parseResult,
        setLoading,
        setData,
        sparql,
        setError,
        token,
        dispatch
      );
    } else {
      processResults(result, setLoading, setData, setError, parseResult);
    }
  }, [result, sparql]);

  return { loading, error, data };
}

const fetchOptions = async (
  parseResult,
  setLoading,
  setData,
  sparql,
  setError,
  token,
  dispatch
) => {
  const results = await submitQuery(sparql, token, dispatch);
  if (results === 'error') {
    setError(true);
  }
  const newData = [];
  if (results && results.results && results.results.bindings) {
    for (const result of results.results.bindings) {
      newData.push(parseResult(result));
    }
  }

  sortByCount(newData);

  setData(newData);
  setLoading(false);
};

const submitQuery = async (query, token, dispatch) => {
  const url = `${publicRuntimeConfig.backend}/sparql?query=${encodeURIComponent(
    query
  )}`;
  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-authorization': token
    };

    const response = await axios.get(url, {
      headers
    });

    return response.status === 200 ? response.data : 'error';
  } catch (error) {
    error.customMessage = 'Error fetching options for Advanced Search';
    error.fullUrl = `Query:\n\n${query}\n\n\nUrl:\n\n${url}`;
    dispatch(addError(error));
  }
};

const processResults = (result, setLoading, setData, setError, parseResult) => {
  if (result === 'error') setError(true);
  else if (result === 'loading') setLoading(true);
  else {
    const newData = [];
    for (const item of result.results.bindings) {
      newData.push(parseResult(item));
    }

    sortByCount(newData);
    setData(newData);
    setLoading(false);
  }
};
