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

const searchable = ['id', 'name', 'email', 'affiliation'];
const headers = [
  'ID',
  'Name',
  'Email',
  'Affiliation',
  'Member',
  'Curator',
  'Admin',
  ''
];

/* eslint sonarjs/no-duplicate-string: "off" */

export default function Users() {
  const token = useSelector(state => state.user.token);
  const { users, loading } = useUsers(token);

  return (
    <div className={styles.plugintable}>
      <Table
        data={users ? users.users : undefined}
        loading={loading}
        title="Users"
        searchable={searchable}
        headers={headers}
        sortOptions={options}
        defaultSortOption={options[0]}
        sortMethods={sortMethods}
        hideFooter={true}
        finalRow={<NewPluginRow type="User" token={token} />}
        dataRowDisplay={user => (
          <UserDisplay key={user.id} user={user} type="User" token={token} />
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

function UserDisplay(properties) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(properties.user.name);
  const [email, setEmail] = useState(properties.user.url);

  useEffect(() => {
    setName(properties.user.name);
    setEmail(properties.user.email);
  }, [properties.user.name, properties.user.url]);

  return !editMode ? (
    <tr key={properties.user.id}>
      <td>{properties.user.id}</td>
      <td>{properties.user.name}</td>
      <td>
        <code>{properties.user.email}</code>
      </td>
      <td>{properties.user.affiliation}</td>
      <td>{properties.user.isMember ? 'Yes' : 'No'}</td>
      <td>{properties.user.isCurator ? 'Yes' : 'No'}</td>
      <td>{properties.user.isAdmin ? 'Yes' : 'No'}</td>
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
                  properties.user.id + 1,
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
    <tr key={properties.user.id}>
      <td>{properties.user.id}</td>
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
          value={email}
          onChange={event => {
            setEmail(event.target.value);
          }}
        />
      </td>
      <td>
        <TableInput
          value={email}
          onChange={event => {
            setEmail(event.target.value);
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
                  properties.user.id,
                  properties.type,
                  name,
                  email,
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
                setName(properties.user.name);
                setEmail(properties.user.email);
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

const useUsers = token => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/admin/users`, token],
    fetcher
  );
  return {
    users: data,
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
