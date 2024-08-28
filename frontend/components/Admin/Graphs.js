import axios from 'axios';
import getConfig from 'next/config';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
// const { publicRuntimeConfig } = getConfig();
import backendUrl from '../GetUrl/GetBackend';

import Table from '../Reusable/Table/Table';
import { addError } from '../../redux/actions';

export default function Graphs() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const { graphs, loading } = useGraphs(token, dispatch);
  return (
    <Table
      data={graphs}
      loading={loading}
      title="Graphs"
      searchable={['graphUri', 'numTriples']}
      headers={['Graph URI', '# Triples']}
      sortOptions={options}
      defaultSortOption={options[0]}
      sortMethods={sortMethods}
      dataRowDisplay={graph => (
        <tr key={graph.graphUri}>
          <td>
            <code>{graph.graphUri}</code>
          </td>
          <td>{graph.numTriples}</td>
        </tr>
      )}
    />
  );
}

const options = [
  { value: 'numTriples', label: '# Triples' },
  { value: 'graphUri', label: 'Graph URI' }
];

const sortMethods = {
  graphUri: function (graph1, graph2) {
    return (graph1.graphUri > graph2.graphUri && 1) || -1;
  },
  numTriples: function (graph1, graph2) {
    return graph2.numTriples - graph1.numTriples;
  }
};

const useGraphs = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${backendUrl}/admin/graphs`, token, dispatch],
    fetcher
  );
  return {
    graphs: data,
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
      error.customMessage = 'Error loading graphs';
      error.fullUrl = url;
      dispatch(addError(error));
    });
