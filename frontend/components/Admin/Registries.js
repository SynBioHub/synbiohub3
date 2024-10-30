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
import { useDispatch, useSelector } from 'react-redux';
import useSWR, { mutate } from 'swr';

import styles from '../../styles/admin.module.css';
import Table from '../Reusable/Table/Table';
import ActionButton from './Reusable/ActionButton';
import TableInput from './Reusable/TableInput';
import { addError } from '../../redux/actions';
const { publicRuntimeConfig } = getConfig();

/* eslint sonarjs/cognitive-complexity: "off" */

const searchable = ['uri', 'url'];
const headers = ['URI Prefix', 'SynBioHub URL', ''];

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'name', label: 'Name' },
  { value: 'displayId', label: 'Identifier' }
];

/* eslint sonarjs/no-duplicate-string: "off" */

export default function Registries() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const [registries, setRegistries] = useState([]);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    setLoading(true);
    try {
      const registriesData = JSON.parse(localStorage.getItem('registries')) || [];
      setRegistries(registriesData);
    } catch (error) {
      console.error('Error fetching registries from localStorage', error);
      dispatch(addError(error));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return (
    <div className={styles.plugintable}>
      <RegistryActions />
      <Table
        data={registries}
        loading={loading}
        title="Local Registries"
        searchable={searchable}
        headers={headers}
        sortOptions={options}
        defaultSortOption={'uri'} 
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
  const dispatch = useDispatch();
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
                saveRegistry(uri, url, properties.token, dispatch);
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
  const dispatch = useDispatch();

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
                deleteRegistry(
                  properties.registry.uri,
                  properties.token,
                  dispatch
                )
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
                saveRegistry(
                  properties.registry.uri,
                  url,
                  properties.token,
                  dispatch
                );
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

function RegistryActions() {
  const [inputOne, setInputOne] = useState('');
  const [inputTwo, setInputTwo] = useState('');
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();

  const url = `${publicRuntimeConfig.backend}/admin/deleteRegistry`;

  const handleFederate = async () => {
    try {
      await axios.post(`${publicRuntimeConfig.backend}/admin/federate`, {
        administratorEmail: inputTwo,
        webOfRegistries: inputOne
      }, {
        headers: {
          'Accept': 'application/json',
          'X-authorization': token
        }
      });
      // Add additional logic here if needed after successful POST
    } catch (error) {
      console.error('Error with federate: ', error);
      // Handle errors here
    }
  };

  const handleRetrieve = async () => {
    try {
      const response = await axios.post(`${publicRuntimeConfig.backend}/admin/retrieveFromWebOfRegistries`, {}, {
        headers: {
          'Accept': 'application/json',
          'X-authorization': token
        }
      });

      if (response.data && Array.isArray(response.data.registries)) {
        // Assuming 'registries' is the correct key in response and it's an array of registry objects
        mutate([
          `${publicRuntimeConfig.backend}/admin/registries`,
          token,
          dispatch
        ]);
      }
    } catch (error) {
      console.error('Error with retrieving from Web Of Registries: ', error);
      // Handle errors here
    }
  };

  return (
    <div className={styles.registryActionsContainer}>
      <input
        type="text"
        value={inputOne}
        onChange={(e) => setInputOne(e.target.value)}
        placeholder="Web of Registries URL"
      />
      <input
        type="text"
        value={inputTwo}
        onChange={(e) => setInputTwo(e.target.value)}
        placeholder="Administrator Email"
      />
      <button onClick={handleFederate}>Federate</button>
      <button onClick={handleRetrieve}>Retrieve</button>
    </div>
  );
}

const deleteRegistry = async (uri, token, dispatch) => {
  const url = `${publicRuntimeConfig.backend}/admin/deleteRegistry`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('uri', uri);

  let response;

  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  if (response.status === 200) {
    mutate([
      `${publicRuntimeConfig.backend}/admin/registries`,
      token,
      dispatch
    ]);
  }
};

const saveRegistry = async (uri, sbhUrl, token, dispatch) => {
  const url = `${publicRuntimeConfig.backend}/admin/saveRegistry`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('uri', uri);
  parameters.append('url', sbhUrl);

  let response;

  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  if (response.status === 200) {
    mutate([
      `${publicRuntimeConfig.backend}/admin/registries`,
      token,
      dispatch
    ]);
  }
};

const options = [
  { value: 'uri', label: 'URI Prefix' },
  { value: 'url', label: 'SynBioHub Url' }
];

const compareStrings = (string1, string2) => {
  if (!string1 && !string2) return 0; // Both strings are undefined or null, they are equal
  if (!string1) return -1; // Only string1 is undefined or null, string1 is less
  if (!string2) return 1;  // Only string2 is undefined or null, string1 is greater

  const lowerString1 = string1.toLowerCase();
  const lowerString2 = string2.toLowerCase();

  return (lowerString1 > lowerString2 && 1) || (lowerString1 < lowerString2 && -1) || 0;
};

const sortMethods = {
  uri: (registry1, registry2) => compareStrings(registry1.uri, registry2.uri),
  url: (registry1, registry2) => compareStrings(registry1.url, registry2.url)
};

export async function processUrl(inputUrl, registries) {
  for (const registry of registries) {
    if (inputUrl.startsWith(registry.uri)) {
      const urlRemovedForLink = inputUrl.replace(registry.uri, "");
      const urlReplacedForBackend = inputUrl.replace(registry.uri, registry.url);
      return { urlRemovedForLink, urlReplacedForBackend };
    }
  }
  return { original: inputUrl };
}