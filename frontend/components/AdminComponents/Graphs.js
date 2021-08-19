import axios from 'axios';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import Table from '../ReusableComponents/Table/Table';

export default function Graphs() {
  const token = useSelector(state => state.user.token);
  const { graphs, loading } = useGraphs(token);
  return (
    <Table
      data={graphs}
      loading={loading}
      title="Graphs"
      searchable={['graphUri', 'numTriples']}
      headers={['Graph URI', '# Triples']}
      sortOptions={options}
      sortMethods={sortMethods}
    />
  );
}

const options = [
  { value: 'graphUri', label: 'Graph URI' },
  { value: 'numTriples', label: '# Triples' }
];

const sortMethods = {
  graphUri: function (graph1, graph2) {
    return (graph1.graphUri > graph2.graphUri && 1) || -1;
  },
  numTriples: function (graph1, graph2) {
    return graph2.numTriples - graph1.numTriples;
  }
};

const useGraphs = token => {
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
