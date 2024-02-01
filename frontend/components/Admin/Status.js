import axios from 'axios';
import getConfig from 'next/config';
import Loader from 'react-loader-spinner';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
const { publicRuntimeConfig } = getConfig();

import styles from '../../styles/defaulttable.module.css';
import { addError } from '../../redux/actions';
import { logoutUser } from '../../redux/actions';

export default function Status() {
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const { status, loading } = useStatus(token, dispatch);

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
              <td>Thread Pool Size</td>
              <td>
                {status.threadPoolSize}
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

export const useStatus = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin`, token, dispatch],
    fetcher
  );
  return {
    status: data,
    loading: !error && !data,
    error: error
  };
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
      if (error.response && error.response.status === 401) {
        // Handle 401 Unauthorized error by signing out and redirecting to the login page
        dispatch(logoutUser()); // Dispatch the logout action to sign out the user
        // window.location.href = '/login'; // Redirect to the login page
      } else {
        // Handle other errors
        error.customMessage = 'Error fetching status';
        error.fullUrl = url;
        dispatch(addError(error));
      }
    });
