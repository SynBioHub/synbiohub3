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

/* eslint sonarjs/cognitive-complexity: "off" */

const searchable = ['uri', 'url'];
const headers = ['URI Prefix', 'SynBioHub URL', ''];

/* eslint sonarjs/no-duplicate-string: "off" */

export default function Registries() {
  const token = useSelector(state => state.user.token);
  const { registries, loading } = useRegistries(token);

  return (
    <div className={styles.plugintable}>
      <Table
        data={registries ? registries.registries : undefined}
        loading={loading}
        title="Local Registries"
        searchable={searchable}
        headers={headers}
        sortOptions={options}
        defaultSortOption={options[0]}
        sortMethods={sortMethods}
        hideFooter={true}
        finalRow={<NewRegistryRow token={token} />}
        dataRowDisplay={registry => (
          <RegistryDisplay
            key={registry.uri}
            registry={registry}
            token={token}
          />
        )}
      />
    </div>
  );
}

function NewRegistryRow(properties) {
  const [uri, setUri] = useState('');
  const [url, setUrl] = useState('');
  return (
    <tr key="New">
      <td>
        <TableInput
          value={uri}
          onChange={event => setUri(event.target.value)}
          placeholder="URI Prefix"
        />
      </td>
      <td>
        <TableInput
          value={url}
          onChange={event => setUrl(event.target.value)}
          placeholder="SynBioHub URL"
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
                saveRegistry(uri, url, properties.token);
                setUri('');
                setUrl('');
              }}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}

function RegistryDisplay(properties) {
  const [editMode, setEditMode] = useState(false);
  const [url, setUrl] = useState(properties.registry.url);

  useEffect(() => {
    setUrl(properties.registry.url);
  }, [properties.registry.url]);

  return !editMode ? (
    <tr key={properties.registry.uri}>
      <td>{properties.registry.uri}</td>
      <td>
        <code>{properties.registry.url}</code>
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
                deleteRegistry(properties.registry.uri, properties.token)
              }
            />
          </div>
        </div>
      </td>
    </tr>
  ) : (
    <tr key={properties.registry.uri}>
      <td>{properties.registry.uri}</td>
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
                saveRegistry(properties.registry.uri, url, properties.token);
                setEditMode(false);
              }}
            />
            <ActionButton
              action="Cancel"
              icon={faTimesCircle}
              color="#888"
              onClick={() => {
                setUrl(properties.registry.url);
                setEditMode(false);
              }}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}

const deleteRegistry = async (uri, token) => {
  const url = `${process.env.backendUrl}/admin/deleteRegistry`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('uri', uri);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: parameters
  });

  if (response.status === 200) {
    mutate([`${process.env.backendUrl}/admin/registries`, token]);
  }
};

const saveRegistry = async (uri, sbhUrl, token) => {
  const url = `${process.env.backendUrl}/admin/saveRegistry`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('uri', uri);
  parameters.append('url', sbhUrl);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: parameters
  });

  if (response.status === 200) {
    mutate([`${process.env.backendUrl}/admin/registries`, token]);
  }
};

const options = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'username', label: 'Username' },
  { value: 'affiliation', label: 'Affiliation' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'curator', label: 'Curator' }
];

const compareStrings = (string1, string2) => {
  return (string1.toLowerCase() > string2.toLowerCase() && 1) || -1;
};

const compareBools = (bool1, bool2) => {
  if (bool1 && !bool2) return -1;
  return 1;
};

const sortMethods = {
  id: function (user1, user2) {
    return user1.id - user2.id;
  },
  name: (user1, user2) => compareStrings(user1.name, user2.name),
  email: (user1, user2) => compareStrings(user1.email, user2.email),
  username: (user1, user2) => compareStrings(user1.username, user2.username),
  affiliation: (user1, user2) =>
    compareStrings(user1.affiliation, user2.affiliation),
  admin: (user1, user2) => compareBools(user1.isAdmin, user2.isAdmin),
  member: (user1, user2) => compareBools(user1.isMember, user2.isMember),
  curator: (user1, user2) => compareBools(user1.isCurator, user2.isCurator)
};

const useRegistries = token => {
  const { data, error } = useSWR(
    [`${process.env.backendUrl}/admin/registries`, token],
    fetcher
  );
  return {
    registries: data,
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