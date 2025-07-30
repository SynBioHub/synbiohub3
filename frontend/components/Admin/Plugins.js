import {
  faPencilAlt,
  faPlusCircle,
  faSave,
  faTimesCircle,
  faTrashAlt,
  faExclamationCircle,
  faRedo
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR, { mutate } from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/admin.module.css';
import Table from '../Reusable/Table/Table';
import ActionButton from './Reusable/ActionButton';
import TableInput from './Reusable/TableInput';
const { publicRuntimeConfig } = getConfig();

const renderingType = 'rendering';
const submittingType = 'submit';
const downloadingType = 'download';
const curatingType = 'curation';
const authorizationType = 'authorization';

const searchable = ['index', 'name', 'url'];
const headers = ['ID', 'Name', 'URL', ''];

import { addError } from '../../redux/actions';
import { use } from 'react';

/* eslint sonarjs/no-duplicate-string: "off" */

export default function Plugins() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const { plugins, loading } = usePlugins(token, dispatch);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  let pluginsUseLocalCompose = useState(false);
  let pluginLocalComposePrefix = useState('');
  if (theme && theme.pluginsUseLocalCompose && theme.pluginLocalComposePrefix) {
    pluginsUseLocalCompose = theme.pluginsUseLocalCompose;
    pluginLocalComposePrefix = theme.pluginLocalComposePrefix;
  }
  return (
    <div>
      <PluginTable
        token={token}
        title="Rendering"
        type={renderingType}
        loading={loading}
        data={plugins ? plugins.rendering : undefined}
        pluginsUseLocalCompose={pluginsUseLocalCompose}
        pluginLocalComposePrefix={pluginLocalComposePrefix}
      />
      <PluginTable
        token={token}
        title="Submission"
        type={submittingType}
        loading={loading}
        data={plugins ? plugins.submit : undefined}
        pluginsUseLocalCompose={pluginsUseLocalCompose}
        pluginLocalComposePrefix={pluginLocalComposePrefix}
      />
      <PluginTable
        token={token}
        title="Downloading"
        type={downloadingType}
        loading={loading}
        data={plugins ? plugins.download : undefined}
        pluginsUseLocalCompose={pluginsUseLocalCompose}
        pluginLocalComposePrefix={pluginLocalComposePrefix}
      />
    </div>
  );
}

/*

      <PluginTable
        token={token}
        title="Curation"
        type={curatingType}
        loading={loading}
        data={plugins ? plugins.curation : undefined}
      />
      <PluginTable
        token={token}
        title="Authorization"
        type={authorizationType}
        loading={loading}
        data={plugins ? plugins.authorization : undefined}
        
      />


//Insert the above code into the table when curation and authorization plugins will be implemented. Other frontend code should then become functional once these plugins can be added

*/
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
            pluginsUseLocalCompose={properties.pluginsUseLocalCompose}
            pluginLocalComposePrefix={properties.pluginLocalComposePrefix}
          />
        )}
      />
    </div>
  );
}

function NewPluginRow(properties) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const dispatch = useDispatch();
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
                savePlugin(
                  'New',
                  properties.type,
                  name,
                  url,
                  properties.token,
                  dispatch
                );
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
  const [status, setStatus] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    setName(properties.plugin.name);
    setUrl(properties.plugin.url);

      const checkStatus = async () => {
        const hidden = await fetchStatus(properties.plugin, properties.type);
        setStatus(hidden);
      };
      checkStatus();

  }, [properties.plugin.name, properties.plugin.url]);

  return !editMode ? (
    <tr key={properties.plugin.index}>
      <td>{properties.plugin.index}</td>
      <td>{properties.plugin.name}</td>
      <td>
        <code>{properties.plugin.url}</code>
        {!status ? (
          <span>
            <FontAwesomeIcon
              icon={faExclamationCircle}
              color={'#FB4C27'}
            ></FontAwesomeIcon>{' '}
            Plugin is not Running
          </span>
        ) : null}
      </td>
      {
      <td>
        <ActionButton 
        action="Refresh Plugin Status"
        icon={faRedo}
        onClick={() => {
          const checkStatus = async () => {
            const hidden = await fetchStatus(properties.plugin, properties.type, properties.pluginsUseLocalCompose, properties.pluginLocalComposePrefix);
            setStatus(hidden);
          };
          checkStatus();
        }}
        />
      </td>
        }
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

const deletePlugin = async (id, type, token, dispatch) => {
  const url = `${publicRuntimeConfig.backend}/admin/deletePlugin`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('id', id);
  parameters.append('category', type);

  let response;

  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  if (response.status === 200) {
    mutate([`${publicRuntimeConfig.backend}/admin/plugins`, token, dispatch]);
  }
};

const savePlugin = async (id, type, name, pluginUrl, token, dispatch) => {
  const url = `${publicRuntimeConfig.backend}/admin/savePlugin`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('id', id !== 'New' ? id + 1 : id);
  parameters.append('category', type);
  parameters.append('name', name);
  parameters.append('url', pluginUrl);

  let response;

  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  if (response && response.status === 200) {
    mutate([`${publicRuntimeConfig.backend}/admin/plugins`, token, dispatch]);
  }
};

const options = [
  { value: 'index', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'url', label: 'URL' }
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
  index: function (plugin1, plugin2) {
    return plugin1.index - plugin2.index;
  },
  name: (plugin1, plugin2) => compareStrings(plugin1.name, plugin2.name),
  url: (plugin1, plugin2) => compareStrings(plugin1.name, plugin2.name)
};

const usePlugins = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/plugins`, token, dispatch],
    fetcher
  );
  return {
    plugins: data,
    loading: !error && !data,
    error: error
  };
};


async function fetchStatus(plugin, type, pluginsUseLocalCompose, pluginLocalComposePrefix) {
  return await axios({
    method: 'POST',
    url: `${publicRuntimeConfig.backend}/callPlugin`,
    data: {
      name: plugin.name,
      endpoint: 'status',
      category: type,
      prefix: pluginsUseLocalCompose ? pluginLocalComposePrefix : ''
    }
  })
    .then(response => {
      return response.status === 200;
    })
    .catch(error => {
      return false;
    });
}


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
      error.customMessage = 'Error fetching plugins';
      error.fullUrl = url;
      dispatch(addError(error));
    });
