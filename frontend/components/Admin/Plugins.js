import {
  faPencilAlt,
  faPlusCircle,
  faSave,
  faTimesCircle,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR, { mutate } from 'swr';

import styles from '../../styles/admin.module.css';
import Table from '../Reusable/Table/Table';
import ActionButton from './Reusable/ActionButton';
import TableInput from './Reusable/TableInput';

const renderingType = 'rendering';
const submittingType = 'submit';
const downloadingType = 'download';

const searchable = ['index', 'name', 'url'];
const headers = ['ID', 'Name', 'URL', ''];

/* eslint sonarjs/no-duplicate-string: "off" */

export default function Plugins() {
  const token = useSelector(state => state.user.token);
  const { plugins, loading } = usePlugins(token);
  return (
    <div>
      <PluginTable
        token={token}
        title="Rendering"
        type={renderingType}
        loading={loading}
        data={plugins ? plugins.rendering : undefined}
      />
      <PluginTable
        token={token}
        title="Submission"
        type={submittingType}
        loading={loading}
        data={plugins ? plugins.submit : undefined}
      />
      <PluginTable
        token={token}
        title="Download"
        type={downloadingType}
        loading={loading}
        data={plugins ? plugins.download : undefined}
      />
    </div>
  );
}

function PluginTable(properties) {
  return (
    <div className={styles.plugintable}>
      <Table
        data={properties.data}
        loading={properties.loading}
        title={properties.title}
        searchable={searchable}
        headers={headers}
        sortOptions={options}
        defaultSortOption={options[0]}
        sortMethods={sortMethods}
        hideFooter={true}
        finalRow={
          <NewPluginRow type={properties.type} token={properties.token} />
        }
        dataRowDisplay={plugin => (
          <PluginDisplay
            key={plugin.index}
            plugin={plugin}
            type={properties.type}
            token={properties.token}
          />
        )}
      />
    </div>
  );
}

function NewPluginRow(properties) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  return (
    <tr key="New">
      <td>New</td>
      <td>
        <TableInput
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Name"
        />
      </td>
      <td>
        <TableInput
          value={url}
          onChange={event => setUrl(event.target.value)}
          placeholder="URL"
        />
      </td>
      <td>
        <div className={styles.actionbuttonscontainer}>
          <div className={styles.actionbuttonslayout}>
            <ActionButton
              action="Create"
              icon={faPlusCircle}
              color="#1C7C54"
              onClick={() => {
                savePlugin('New', properties.type, name, url, properties.token);
                setName('');
                setUrl('');
              }}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}

function PluginDisplay(properties) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(properties.plugin.name);
  const [url, setUrl] = useState(properties.plugin.url);

  useEffect(() => {
    setName(properties.plugin.name);
    setUrl(properties.plugin.url);
  }, [properties.plugin.name, properties.plugin.url]);

  return !editMode ? (
    <tr key={properties.plugin.index}>
      <td>{properties.plugin.index}</td>
      <td>{properties.plugin.name}</td>
      <td>
        <code>{properties.plugin.url}</code>
      </td>
      <td>
        <div className={styles.actionbuttonscontainer}>
          <div className={styles.actionbuttonslayout}>
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
            setUrl(event.target.value);
          }}
        />
      </td>
      <td>
        <div className={styles.actionbuttonscontainer}>
          <div className={styles.actionbuttonslayout}>
            <ActionButton
              action="Save"
              icon={faSave}
              color="#1C7C54"
              onClick={() => {
                savePlugin(
                  properties.plugin.index,
                  properties.type,
                  name,
                  url,
                  properties.token
                );
                setEditMode(false);
              }}
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

const savePlugin = async (id, type, name, pluginUrl, token) => {
  const url = `${process.env.backendUrl}/admin/savePlugin`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('id', id !== 'New' ? id + 1 : id);
  parameters.append('category', type);
  parameters.append('name', name);
  parameters.append('url', pluginUrl);

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

const compareStrings = (string1, string2) => {
  return (string1.toLowerCase() > string2.toLowerCase() && 1) || -1;
};

const sortMethods = {
  index: function (plugin1, plugin2) {
    return plugin1.index - plugin2.index;
  },
  name: (plugin1, plugin2) => compareStrings(plugin1.name, plugin2.name),
  url: (plugin1, plugin2) => compareStrings(plugin1.name, plugin2.name)
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