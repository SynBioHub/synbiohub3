import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import WindowedSelect from 'react-windowed-select';
import { createFilter } from 'react-windowed-select';

import styles from '../../../styles/advancedsearch.module.css';
import Loading from '../../Reusable/MiniLoading';
import { useDispatch, useSelector } from 'react-redux';
import { addError } from '../../../redux/actions';
import axios from 'axios';
// const { publicRuntimeConfig } = getConfig();
import backendUrl from '../../GetUrl/GetBackend';

const customFilter = createFilter({ ignoreAccents: false });

export default function SelectLoader(properties) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  
  useEffect(() => {
    if (!properties.result) {
      fetchOptions(
        properties.parseResult,
        setLoading,
        setData,
        properties.sparql,
        setError,
        token,
        dispatch
      );
    } else {
      processResults(
        properties.result,
        setLoading,
        setData,
        setError,
        properties.parseResult
      );
    }
  }, [properties.result]);

  if (error) {
    return <div>Error Occured</div>;
  }
  if (loading) {
    return <Loading height={20} />;
  }
  return (
    <WindowedSelect
      isMulti={properties.isMulti}
      filterOption={customFilter}
      options={data}
      isClearable={true}
      placeholder={properties.placeholder}
      className={styles.optionselect}
      onChange={option => {
        properties.onChange(option);
      }}
    />
  );
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
  setData(newData);
  setLoading(false);
};

const submitQuery = async (query, token, dispatch) => {
  const url = `${backendUrl}/sparql?query=${encodeURIComponent(
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
    for (const result of result.results.bindings) {
      newData.push(parseResult(result));
    }
    setData(newData);
    setLoading(false);
  }
};
