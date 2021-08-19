import {
  faCloudUploadAlt,
  faPencilAlt,
  faTimesCircle,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR, { mutate } from 'swr';

import styles from '../../styles/admin.module.css';
import Table from '../ReusableComponents/Table/Table';
import ActionButton from './Reusable/ActionButton';
import TableInput from './Reusable/TableInput';

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
          headers={['ID', 'Name', 'URL', 'Actions']}
          sortOptions={options}
          defaultSortOption={options[0]}
          sortMethods={sortMethods}
          hideFooter={true}
          dataRowDisplay={plugin => (
            <PluginDisplay plugin={plugin} type="rendering" token={token} />
          )}
        />
      </div>
      <div className={styles.plugintable}>
        <Table
          data={plugins ? plugins.submit : undefined}
          loading={loading}
          title="Submission"
          searchable={['index', 'name', 'url']}
          headers={['ID', 'Name', 'URL', 'Actions']}
          sortOptions={options}
          defaultSortOption={options[0]}
          sortMethods={sortMethods}
          hideFooter={true}
          dataRowDisplay={plugin => (
            <PluginDisplay plugin={plugin} type="submit" token={token} />
          )}
        />
      </div>
      <div className={styles.plugintable}>
        <Table
          data={plugins ? plugins.download : undefined}
          loading={loading}
          title="Download"
          searchable={['index', 'name', 'url']}
          headers={['ID', 'Name', 'URL', 'Actions']}
          sortOptions={options}
          defaultSortOption={options[0]}
          sortMethods={sortMethods}
          hideFooter={true}
          dataRowDisplay={plugin => (
            <PluginDisplay plugin={plugin} type="download" token={token} />
          )}
        />
      </div>
    </div>
  );
}

function PluginDisplay(properties) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(properties.plugin.name);
  const [url, setUrl] = useState(properties.plugin.url);
  return !editMode ? (
    <tr key={properties.plugin.index}>
      <td>{properties.plugin.index}</td>
      <td>{properties.plugin.name}</td>
      <td>
        <code>{properties.plugin.url}</code>
      </td>
      <td>
        <div className={styles.actionbuttonscontainer}>
          <ActionButton
            action="Edit"
            icon={faPencilAlt}
            color="#00A1E4"
            onClick={() => setEditMode(true)}
          />
          <ActionButton
            action="Delete"
            icon={faTrashAlt}
            color="#FF3C38"
            onClick={() =>
              deletePlugin(
                properties.plugin.index + 1,
                properties.type,
                properties.token
              )
            }
          />
        </div>
      </td>
    </tr>
  ) : (
    <tr key={properties.plugin.index}>
      <td>{properties.plugin.index}</td>
      <td>
        <TableInput
          value={name}
          onChange={event => {
            setName(event.target.value);
          }}
        />
      </td>
      <td>
        <TableInput
          value={url}
          onChange={event => {
            setUrl(event.target.url);
          }}
        />
      </td>
      <td>
        <div className={styles.actionbuttonscontainer}>
          <ActionButton
            action="Save"
            icon={faCloudUploadAlt}
            color="#1C7C54"
            onClick={() => setEditMode(true)}
          />
          <ActionButton
            action="Cancel"
            icon={faTimesCircle}
            color="#888"
            onClick={() => {
              setName(properties.plugin.name);
              setUrl(properties.plugin.url);
              setEditMode(false);
            }}
          />
        </div>
      </td>
    </tr>
  );
}

const deletePlugin = async (id, type, token) => {
  const url = `${process.env.backendUrl}/admin/deletePlugin`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('id', id);
  parameters.append('category', type);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: parameters
  });

  if (response.status === 200) {
    mutate([`${process.env.backendUrl}/admin/plugins`, token]);
  }
};

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
