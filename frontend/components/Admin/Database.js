import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR, { mutate } from 'swr';

import styles from '../../styles/admin.module.css';
import { addError } from '../../redux/actions';
import Loading from '../Reusable/Loading';
import ErrorMessage from './Reusable/ErrorMessage';
import SaveButton from './Reusable/SaveButton';

const { publicRuntimeConfig } = getConfig();

export default function Database() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const { config, loading } = useDatabaseConfig(token, dispatch);
  const [sparqlEndpoint, setSparqlEndpoint] = useState('');
  const [graphStoreEndpoint, setGraphStoreEndpoint] = useState('');
  const [triplestoreAuth, setTriplestoreAuth] = useState('digest');
  const [error, setError] = useState('');

  useEffect(() => {
    if (config) {
      setSparqlEndpoint(config.sparqlEndpoint || '');
      setGraphStoreEndpoint(config.graphStoreEndpoint || '');
      setTriplestoreAuth(config.triplestoreAuth === 'basic' ? 'basic' : 'digest');
    }
  }, [config]);

  if (loading) {
    return <Loading />;
  }
  if (!config) {
    return <div>Error</div>;
  }

  return (
    <div className={styles.mailcontainer}>
      <h2 className={styles.mailheader}>Database Configuration</h2>
      {error && <ErrorMessage message={error} />}

      <p>SPARQL Endpoint</p>
      <input
        className={styles.tableinput}
        type="text"
        value={sparqlEndpoint}
        onChange={e => setSparqlEndpoint(e.target.value)}
      />

      <p>Graph Store Endpoint</p>
      <input
        className={styles.tableinput}
        type="text"
        value={graphStoreEndpoint}
        onChange={e => setGraphStoreEndpoint(e.target.value)}
      />

      <p>Triplestore Auth</p>
      <select
        className={styles.tableinput}
        value={triplestoreAuth}
        onChange={e => setTriplestoreAuth(e.target.value)}
      >
        <option value="digest">digest (Virtuoso)</option>
        <option value="basic">basic (sbol-db)</option>
      </select>

      <div className={styles.savebuttoncontainer}>
        <SaveButton
          onClick={() =>
            saveDatabaseConfig(
              sparqlEndpoint,
              graphStoreEndpoint,
              triplestoreAuth,
              token,
              setError,
              dispatch
            )
          }
        />
      </div>
    </div>
  );
}

const useDatabaseConfig = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/database`, token, dispatch],
    fetcher
  );
  return {
    config: data,
    loading: !error && !data,
    error
  };
};

const fetcher = (url, token, dispatch) =>
  axios
    .get(url, {
      headers: {
        Accept: 'application/json',
        'X-authorization': token
      }
    })
    .then(response => response.data)
    .catch(error => {
      error.customMessage = 'Error fetching database config';
      error.fullUrl = url;
      dispatch(addError(error));
    });

const saveDatabaseConfig = async (
  sparqlEndpoint,
  graphStoreEndpoint,
  triplestoreAuth,
  token,
  setError,
  dispatch
) => {
  const url = `${publicRuntimeConfig.backend}/admin/database`;
  const parameters = new URLSearchParams();
  parameters.append('sparqlEndpoint', sparqlEndpoint);
  parameters.append('graphStoreEndpoint', graphStoreEndpoint);
  parameters.append('triplestoreAuth', triplestoreAuth);

  try {
    const response = await axios.post(url, parameters, {
      headers: {
        Accept: 'text/plain',
        'X-authorization': token
      }
    });
    setError('');
    alert(typeof response.data === 'string' ? response.data : 'Saved');
    mutate([url, token, dispatch]);
  } catch (error) {
    const message =
      typeof error.response?.data === 'string'
        ? error.response.data
        : error.message || 'Update failed';
    setError(message);
    alert(`Could not save: ${message}`);
  }
};
