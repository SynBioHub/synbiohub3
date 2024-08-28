import axios from 'axios';
import he from 'he';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
// const { publicRuntimeConfig } = getConfig();

import styles from '../../styles/admin.module.css';
import Loading from '../Reusable/Loading';
import { addError } from '../../redux/actions';
import backendUrl from '../GetUrl/GetBackend';

export default function Log() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const { log, loading } = useLog(token, dispatch);
  const [logDisplay, setLogDisplay] = useState();
  const [viewing, setViewing] = useState('error');

  useEffect(() => {
    if (log) {
      setLogDisplay(
        log.map((line, index) => {
          if (line.level === viewing) return decodeHtml(line.line, index);
        })
      );
    }
  }, [log, viewing]);

  if (loading) return <Loading />;

  return (
    <div>
      <div className={styles.logheaders}>
        <LogHeader title="Error" viewing={viewing} setViewing={setViewing} />
        <LogHeader title="Warn" viewing={viewing} setViewing={setViewing} />
        <LogHeader title="Info" viewing={viewing} setViewing={setViewing} />
        <LogHeader title="Debug" viewing={viewing} setViewing={setViewing} />
      </div>
      <div className={styles.logdisplay}>{logDisplay}</div>
    </div>
  );
}

function LogHeader(properties) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    setSelected(properties.viewing === properties.title.toLowerCase());
  }, [properties.viewing, properties.title]);

  return (
    <div
      className={`${styles.logheader} ${
        selected ? styles.logselected : styles.lognotselected
      }`}
      onClick={() => properties.setViewing(properties.title.toLowerCase())}
      role="button"
    >
      {properties.title}
    </div>
  );
}

const decodeHtml = (line, index) => {
  const lines = he.decode(line).split('<br>');
  return lines.map(element => {
    index++;
    return <p key={index}>{element}</p>;
  });
};

const useLog = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${backendUrl}/admin/log`, token, dispatch],
    fetcher
  );
  return {
    log: data,
    loading: !error && !data
  };
};

const fetcher = (url, token, dispatch) =>
  axios
    .get(url, {
      headers: {
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
    .then(response => response.data)
    .catch(error => {
      error.customMessage = 'Request failed for GET /admin/log';
      error.fullUrl = url;
      dispatch(addError(error));
    });
