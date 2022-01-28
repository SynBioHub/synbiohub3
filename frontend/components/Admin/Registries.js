import {
  faPencilAlt,
  faPlusCircle,
  faSave,
  faTimesCircle,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR, { mutate } from 'swr';

import styles from '../../styles/admin.module.css';
import Table from '../Reusable/Table/Table';
import ActionButton from './Reusable/ActionButton';
import TableInput from './Reusable/TableInput';
const { publicRuntimeConfig } = getConfig();

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
  const url = `${publicRuntimeConfig.backend}/admin/deleteRegistry`;
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
    mutate([`${publicRuntimeConfig.backend}/admin/registries`, token]);
  }
};

const saveRegistry = async (uri, sbhUrl, token) => {
  const url = `${publicRuntimeConfig.backend}/admin/saveRegistry`;
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
    mutate([`${publicRuntimeConfig.backend}/admin/registries`, token]);
  }
};

const options = [
  { value: 'uri', label: 'URI Prefix' },
  { value: 'url', label: 'SynBioHub Url' }
];

const compareStrings = (string1, string2) => {
  return (string1.toLowerCase() > string2.toLowerCase() && 1) || -1;
};

const sortMethods = {
  uri: (registry1, registry2) => compareStrings(registry1.uri, registry2.uri),
  url: (registry1, registry2) => compareStrings(registry1.url, registry2.url)
};

const useRegistries = token => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/registries`, token],
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
