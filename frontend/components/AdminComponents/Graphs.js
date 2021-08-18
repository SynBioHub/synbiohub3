import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import useSWR from 'swr';

import styles from '../../styles/defaulttable.module.css';

/* eslint sonarjs/cognitive-complexity: "off" */
export default function Graphs() {
  const token = useSelector(state => state.user.token);
  const { graphs, loading } = useStatus(token);
  const [filteredGraphs, setFilteredGraphs] = useState([]);
  const [graphDisplay, setGraphDisplay] = useState([]);
  const [sortType, setSortType] = useState('');
  const [numberEntries, setNumberEntries] = useState(
    numberDisplayOptions[0].value
  );
  const [filter, setFilter] = useState('');
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (filteredGraphs) {
      if (sortType === 'graphUri')
        filteredGraphs.sort(
          (graph1, graph2) => (graph1[sortType] > graph2[sortType] && 1) || -1
        );
      else if (sortType === 'numTriples')
        filteredGraphs.sort(
          (graph1, graph2) => graph2[sortType] - graph1[sortType]
        );
      setGraphDisplay(
        filteredGraphs
          .slice(
            offset,
            Math.min(
              filteredGraphs.length,
              numberEntries === 'all'
                ? filteredGraphs.length
                : offset + numberEntries
            )
          )
          .map(graph => {
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
  }, [filteredGraphs, sortType, numberEntries, filter, offset]);

  useEffect(() => {
    if (graphs) {
      setFilteredGraphs(
        graphs.filter(
          graph =>
            graph.graphUri.includes(filter) ||
            graph.numTriples.toString().includes(filter)
        )
      );
    }
  }, [graphs, filter]);

  useEffect(() => {
    setOffset(0);
  }, [filter]);

  if (graphs) {
    return (
      <div className={styles.statuscontainer}>
        <div className={styles.tableheader}>
          <div className={styles.tableheadertitle}>
            Graphs ({graphs.length})
          </div>
          <div className={styles.tableheadernav}>
            <div className={styles.sortbycontainer} id={styles.filterresults}>
              <span className={styles.tableheadernavlabel}>SEARCH</span>
              <input
                type="text"
                className={`${styles.tableheadernavflex} ${styles.filterinput}`}
                value={filter}
                onChange={event => setFilter(event.target.value)}
              />
            </div>
            <div className={styles.sortbycontainer}>
              <span className={styles.tableheadernavlabel}>SORT BY</span>
              <Select
                options={options}
                className={styles.tableheadernavflex}
                onChange={option => setSortType(option.value)}
                menuPortalTarget={document.querySelector('body')}
              />
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
              onChange={option => setNumberEntries(option.value)}
            />
            <span className={styles.tableheadernavlabel}>ENTRIES</span>
          </div>
          <div className={styles.tablefooternav}>
            <div
              className={styles.tablefooternavicon}
              onClick={() => setOffset(Math.max(0, offset - numberEntries))}
              role="button"
            >
              <FontAwesomeIcon icon={faAngleLeft} size="1x" />
            </div>
            <span className={styles.tablefooternavstart}>1</span>
            <span className={styles.tablefooternavselected}>2</span>
            <span>3</span>
            <p>...</p>
            <span className={styles.tablefooternavend}>16</span>
            <div
              className={styles.tablefooternavicon}
              onClick={() => {
                if (offset + numberEntries < filteredGraphs.length)
                  setOffset(offset + numberEntries);
              }}
              role="button"
            >
              <FontAwesomeIcon icon={faAngleRight} size="1x" />
            </div>
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
  { value: 'all', label: 'all' }
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
