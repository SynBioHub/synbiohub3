import {
  faPencilAlt,
  faPlusCircle,
  faSave,
  faTimesCircle,
  faTrashAlt,
  faClock,
  faGlobeAmericas,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  const [worInfo, setWorInfo] = useState(null);
  

  useEffect(() => {
    setLoading(true);
    const fetchRegistries = async () => {
      try {
        const response = await axios.get(
          `${publicRuntimeConfig.backend}/admin/registries`,
          {
            headers: {
              'Accept': 'application/json',
              'X-authorization': token
            }
          }
        );
        setWorInfo(response.data); // <-- update state here
        setRegistries(response.data.registries || []);
      } catch (error) {
        console.error('Error fetching registries from backend', error);
        dispatch(addError(error));
      } finally {
        setLoading(false);
      }
    };
    fetchRegistries();
  }, [dispatch, token]);

  return (
    <div className={styles.plugintable}>
      <RegistryActions 
        worInfo={worInfo}
        setRegistries={setRegistries}
      />
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

function RegistryActions({ worInfo, setRegistries }) {
  const [inputOne, setInputOne] = useState('');
  const [inputTwo, setInputTwo] = useState('');
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const theme = JSON.parse(localStorage.getItem('theme')) || {};

  useEffect(() => {
    if (worInfo && worInfo.registered) {
      setInputOne(worInfo.wor || '');
      setInputTwo(worInfo.adminEmail || '');
    }
  }, [worInfo]);

  const handleFederate = async () => {
    try {
      const params = new URLSearchParams();
      params.append('administratorEmail', inputTwo);
      //remove trailing slash if it exists
      let urlToSend = inputOne.endsWith('/') ? inputOne.slice(0, -1) : inputOne;
      params.append('webOfRegistries', urlToSend);

      await axios.post(
        `${publicRuntimeConfig.backend}/admin/federate`,
        params,
        {
          headers: {
            'Accept': 'text/html',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-authorization': token
          }
        }
      );
      window.location.reload();
    } catch (error) {
      console.error('Error with federate: ', error);
      // Handle errors here
    }
  };

  const handleRetrieve = async () => {
    /* try {
      const response = await axios.post(`${publicRuntimeConfig.backend}/admin/retrieveFromWebOfRegistries`, {}, {
        headers: {
          'Accept': 'application/json',
          'X-authorization': token
        }
      });

      if (response.status === 200) {
        setRegistries(response.data.registries || []);
        dispatch(addError('Successfully retrieved registries from Web of Registries'));
      } else {
        dispatch(addError('Failed to retrieve registries from Web of Registries'));
      }
    } catch (error) {
      console.error('Error with retrieving from Web Of Registries: ', error);
      // Handle errors here
    } */
   try {
      const response = await axios.post(
        `${publicRuntimeConfig.backend}/admin/retrieveFromWebOfRegistries`,
        {}, // empty body
        {
          headers: {
            'Accept': 'application/json',
            'X-authorization': token
          }
        }
      );

      if (response.status === 200) {
        window.location.reload();
      } else {
        dispatch(addError('Failed to retrieve registries from Web of Registries'));
      }
    } catch (error) {
      console.error('Error with retrieving from Web Of Registries: ', error);
      // Handle errors here
    }
  };

  const handleUpdate = async () => {
    try {
      const params = new URLSearchParams();
      params.append('administratorEmail', inputTwo);

      await axios.post(
        `${publicRuntimeConfig.backend}/admin/setAdministratorEmail`,
        params,
        {
          headers: {
            'Accept': 'text/html',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-authorization': token
          }
        }
      );
      window.location.reload();
    } catch (error) {
      console.error('Error with update: ', error);
      // Handle errors here
    }
  };

  const handleDelete = async () => {
    try {
      const url = `${worInfo.wor}/instances/${worInfo.worId}/`
      const headers = {
        'updateSecret': worInfo.secret
      };


      const response = await axios.delete(url, { headers });

      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting registry:', error);
      // Optionally dispatch an error or show a toast here
    }
  };

  return (
    <div>
      <h3 className={styles.tableheadertitle}>Web of Registries</h3>
        {worInfo && worInfo.registered ? (
          <div>
            <div className={styles.registryinfo}>
              {worInfo.approved ? (
                <div>
                  <FontAwesomeIcon
                    icon={faCheck}
                    size="1x"
                    color="#34eb83ff"
                    className={styles.backtobasketarrow}
                  />
                  {theme.instanceName} is part of the Web of Registries
                </div>

              ) : (
                <div>
                  <FontAwesomeIcon
                    icon={faClock}
                    size="1x"
                    color="#6db2f2ff"
                    className={styles.backtobasketarrow}
                  />
                  {theme.instanceName} pending approval by the Web of Registries Administrator
                </div>
              )}
              <div>
                <FontAwesomeIcon
                  icon={faGlobeAmericas}
                  size="1x"
                  color="#34eb83ff"
                  className={styles.backtobasketarrow}
                />
                The Web of Registries can update {theme.instanceName}
              </div>
            </div>

            <div className={styles.registryActionsContainer}>
              <input
                type="text"
                value={inputOne}
                placeholder="Web of Registries URL"
                readOnly
              />
              <input
                type="text"
                value={inputTwo}
                onChange={(e) => setInputTwo(e.target.value)}
                placeholder="Administrator Email"
              />
              <button onClick={handleUpdate}>Update</button>
              <button onClick={handleRetrieve}>Retrieve</button>
              <button onClick={handleDelete}>Delete</button>
            </div>
          </div>

          

        )
      
      :
      
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
      </div>
      }
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