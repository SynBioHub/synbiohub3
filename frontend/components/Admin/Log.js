import axios from 'axios';
import he from 'he';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import styles from '../../styles/admin.module.css';
import Loading from '../Reusable/Loading';

export default function Log() {
  const token = useSelector(state => state.user.token);
  const { log, loading } = useLog(token);
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
      {logDisplay}
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

const useLog = token => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/admin/log`, token],
    fetcher
  );
  return {
    log: data,
    loading: !error && !data
  };
};

const fetcher = (url, token) =>
  axios
    .get(url, {
      headers: {
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
    .then(response => response.data);
