import axios from 'axios';
import getConfig from 'next/config';
import he from 'he';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
const { publicRuntimeConfig } = getConfig();

import styles from '../../styles/admin.module.css';
import Loading from '../Reusable/Loading';
import { addError } from '../../redux/actions';

export default function Log() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch log list for dropdown
  const { data: logFiles, error: logFilesError } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/listLogs`, token, dispatch],
    fetcher
  );

  // Fetch log data for selected log file
  const { log, loading } = useLog(token, dispatch, selectedLog);

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
      {/* Dropdown selector for log files */}
      <div className={styles.logdropdown}>
        <select
          value={selectedLog || ''}
          onChange={e => setSelectedLog(e.target.value || null)}
        >
          <option value="">Most Recent Log</option>
          {Array.isArray(logFiles?.logs) &&
            logFiles.logs.map((log, idx) => (
              <option key={idx} value={log.filename}>
                {log.title}
              </option>
            ))}
        </select>
      </div>
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

const useLog = (token, dispatch, filename = null) => {
  // Build the URL with filename as a query parameter if present
  let url = `${publicRuntimeConfig.backend}/admin/log`;
  if (filename) {
    url += `?filename=${encodeURIComponent(filename)}`;
  }
  const { data, error } = useSWR([url, token, dispatch], fetcher);
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
