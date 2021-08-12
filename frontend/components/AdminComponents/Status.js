import axios from 'axios';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import styles from '../../styles/defaulttable.module.css';

export default function Status() {
  const token = useSelector(state => state.user.token);
  const { status, loading } = useStatus(token);
  if (status) {
    return (
      <div className={styles.statuscontainer}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td>Platform</td>
              <td>
                {status.platform} {status.architecture}; {status.osRelease}
              </td>
            </tr>
            <tr>
              <td>Node Version</td>
              <td>{status.nodeVersion}</td>
            </tr>
            <tr>
              <td>Instance Name</td>
              <td>{status.instanceName}</td>
            </tr>
            <tr>
              <td>Listen Port</td>
              <td>{status.listenPort}</td>
            </tr>
            <tr>
              <td>SPARQL Endpoint</td>
              <td>
                <code>{status.sparqlEndpoint}</code>
              </td>
            </tr>
            <tr>
              <td>Graph Store Endpoint</td>
              <td>
                <code>{status.graphStoreEndpoint}</code>
              </td>
            </tr>
            <tr>
              <td>Default Graph</td>
              <td>
                <code>{status.defaultGraph}</code>
              </td>
            </tr>
            <tr>
              <td>Graph Prefix</td>
              <td>
                <code>{status.graphPrefix}</code>
              </td>
            </tr>
            <tr>
              <td>Upload Limit</td>
              <td>{status.uploadLimit}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  } else if (loading)
    return (
      <div className={styles.loadercontainer}>
        <div className={styles.loaderanimation}>
          <Loader color="#D25627" type="ThreeDots" />
        </div>
      </div>
    );
  else {
    return (
      <div className={styles.error}>
        Errors were encountered while fetching status
      </div>
    );
  }
}

const useStatus = token => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/admin`, token],
    fetcher
  );
  return {
    status: data,
    loading: !error && !data,
    error: error
  };
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
