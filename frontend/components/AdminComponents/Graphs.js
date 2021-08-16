import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import useSWR from 'swr';

import styles from '../../styles/defaulttable.module.css';

export default function Graphs() {
  const token = useSelector(state => state.user.token);
  const { graphs, loading } = useStatus(token);
  const [graphDisplay, setGraphDisplay] = useState([]);

  useEffect(() => {
    if (graphs) {
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
    }
  }, [graphs]);

  if (graphs) {
    return (
      <div className={styles.statuscontainer}>
        <div className={styles.tableheader}>
          <div className={styles.tableheadertitle}>
            Graphs ({graphs.length})
          </div>
          <div className={styles.tableheadernav}>
            <div className={styles.sortbycontainer} id={styles.filterresults}>
              <span className={styles.tableheadernavlabel}>FILTER</span>
              <input
                type="text"
                className={`${styles.tableheadernavflex} ${styles.filterinput}`}
              />
            </div>
            <div className={styles.sortbycontainer}>
              <span className={styles.tableheadernavlabel}>SORT BY</span>
              <Select options={options} className={styles.tableheadernavflex} />
            </div>
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Graph URI</th>
              <th># Triples</th>
            </tr>
          </thead>
          <tbody>{graphDisplay}</tbody>
        </table>
        <div className={styles.tablefooter}>
          <div className={styles.sortbycontainer}>
            <span className={styles.tableheadernavlabel}>SHOW</span>
            <Select
              options={numberDisplayOptions}
              defaultValue={numberDisplayOptions[0]}
              className={styles.tableheadernavflex}
              menuPortalTarget={document.querySelector('body')}
            />
            <span className={styles.tableheadernavlabel}>ENTRIES</span>
          </div>
          <div className={styles.tablefooternav}>
            <FontAwesomeIcon
              icon={faAngleLeft}
              size="2x"
              className={styles.tablefooternavicon}
            />
            <span className={styles.tablefooternavstart}>1</span>
            <span className={styles.tablefooternavselected}>2</span>
            <span>3</span>
            <span>...</span>
            <span className={styles.tablefooternavend}>16</span>
            <FontAwesomeIcon
              icon={faAngleRight}
              size="2x"
              className={styles.tablefooternavicon}
            />
          </div>
        </div>
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

const options = [
  { value: 'graphUri', label: 'Graph URI' },
  { value: 'numTriples', label: '# Triples' }
];

const numberDisplayOptions = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 'all', label: 'ALL' }
];

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
