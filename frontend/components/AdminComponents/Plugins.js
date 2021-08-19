import axios from 'axios';
import { useSelector } from 'react-redux';
import useSWR from 'swr';

import styles from '../../styles/admin.module.css';
import Table from '../ReusableComponents/Table/Table';

export default function Plugins() {
  const token = useSelector(state => state.user.token);
  const { plugins, loading } = usePlugins(token);
  return (
    <div>
      <div className={styles.plugintable}>
        <Table
          data={plugins ? plugins.rendering : undefined}
          loading={loading}
          title="Rendering"
          searchable={['index', 'name', 'url']}
          headers={['ID', 'Name', 'URL']}
          sortOptions={options}
          defaultSortOption={options[0]}
          sortMethods={sortMethods}
          hideFooter={true}
          dataRowDisplay={plugin => <PluginDisplay plugin={plugin} />}
        />
      </div>
      <div className={styles.plugintable}>
        <Table
          data={plugins ? plugins.submit : undefined}
          loading={loading}
          title="Submission"
          searchable={['index', 'name', 'url']}
          headers={['ID', 'Name', 'URL']}
          sortOptions={options}
          defaultSortOption={options[0]}
          sortMethods={sortMethods}
          hideFooter={true}
          dataRowDisplay={plugin => <PluginDisplay plugin={plugin} />}
        />
      </div>
      <div className={styles.plugintable}>
        <Table
          data={plugins ? plugins.download : undefined}
          loading={loading}
          title="Download"
          searchable={['index', 'name', 'url']}
          headers={['ID', 'Name', 'URL']}
          sortOptions={options}
          defaultSortOption={options[0]}
          sortMethods={sortMethods}
          hideFooter={true}
          dataRowDisplay={plugin => <PluginDisplay plugin={plugin} />}
        />
      </div>
    </div>
  );
}

function PluginDisplay(properties) {
  return (
    <tr key={properties.plugin.index}>
      <td>{properties.plugin.index}</td>
      <td>{properties.plugin.name}</td>
      <td>
        <code>{properties.plugin.url}</code>
      </td>
    </tr>
  );
}

const options = [
  { value: 'index', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'url', label: 'URL' }
];

const sortString = (plugin1, plugin2) => {
  return (plugin1.name > plugin2.name && 1) || -1;
};

const sortMethods = {
  index: function (plugin1, plugin2) {
    return plugin1.index - plugin2.index;
  },
  name: sortString,
  url: sortString
};

const usePlugins = token => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/admin/plugins`, token],
    fetcher
  );
  return {
    plugins: data,
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
