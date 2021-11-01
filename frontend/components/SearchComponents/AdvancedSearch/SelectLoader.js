import { useEffect, useState } from 'react';
import WindowedSelect from 'react-windowed-select';
import { createFilter } from 'react-windowed-select';

import styles from '../../../styles/advancedsearch.module.css';
import Loading from '../../ReusableComponents/MiniLoading';

const customFilter = createFilter({ ignoreAccents: false });

export default function SelectLoader(properties) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);
  useEffect(() => {
    fetchOptions(
      properties.parseResult,
      setLoading,
      setData,
      properties.sparql,
      setError
    );
  }, []);

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
      className={styles.optionselect}
    />
  );
}

const fetchOptions = async (
  parseResult,
  setLoading,
  setData,
  sparql,
  setError
) => {
  const results = await submitQuery(sparql);
  if (results === 'error') {
    setError(true);
  }
  const newData = [];
  for (const result of results.results.bindings) {
    newData.push(parseResult(result));
  }
  setData(newData);
  setLoading(false);
};

const submitQuery = async query => {
  const url = `${process.env.backendUrl}/sparql?query=${encodeURIComponent(
    query
  )}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  return response.status === 200 ? await response.json() : 'error';
};
