import axios from 'axios';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import styles from '../../styles/defaulttable.module.css';

export default function Graphs() {
  const token = useSelector(state => state.user.token);
  const { graphs, loading } = useStatus(token);
  const [graphDisplay, setGraphDisplay] = useState([]);

  useEffect(() => {
    setGraphDisplay(
      graphs.map(graph => {
        return (
          <tr key={graph.graphUri}>
            <td>
              <code>{graph.graphUri}</code>
            </td>
            <td>{graph.numTriples}</td>
          </tr>
        );
      })
    );
  }, [graphs]);

  if (graphs) {
    return (
      <div className={styles.statuscontainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Graph URI</th>
              <th># Triples</th>
            </tr>
          </thead>
          <tbody>{graphDisplay}</tbody>
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
    [`${process.env.backendUrl}/admin/graphs`, token],
    fetcher
  );
  return {
    graphs: data,
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
