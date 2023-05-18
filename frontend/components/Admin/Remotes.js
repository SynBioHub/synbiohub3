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

import Dropdown from 'react-bootstrap/Dropdown';

import styles from '../../styles/admin.module.css';
import Table from '../Reusable/Table/Table';
import ActionButton from './Reusable/ActionButton';
import TableInput from './Reusable/TableInput';
import { addError } from '../../redux/actions';
const { publicRuntimeConfig } = getConfig();

/* eslint sonarjs/cognitive-complexity: "off" */

const searchable = ['uri', 'url'];
const headers = ['ID', 'Type', 'URL', ''];

/* eslint sonarjs/no-duplicate-string: "off" */

export default function Remotes() { 
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const { registries, loading } = useRegistries(token, dispatch);
  console.log(registries);

  return (
    <div className={styles.plugintable}>
      <Table
        data={registries ? registries.remotes : undefined}
        loading={loading}
        title="Remotes"
        searchable={searchable}
        headers={headers}
        sortOptions={options}
        defaultSortOption={options[0]}
        sortMethods={sortMethods}
        hideFooter={true}
        finalRow={<NewRegistryRow token={token} />}
        dataRowDisplay={remote => <RemoteDisplay remote={remote} />}
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

function RemoteDisplay(properties) {
  // const [editMode, setEditMode] = useState(false);
  // const [url, setUrl] = useState(properties.registry.url);
  const dispatch = useDispatch();
  console.log(properties);

  // useEffect(() => {
  //   setUrl(properties.registry.url);
  // }, [properties.registry.url]);
  if (!properties.remote) return null;

  return (  
    <tr>
      <td>{properties.remote.id}</td>

      <td>
  <DropdownButton title="Select an option" id="dropdown-menu">
    <Dropdown.Item eventKey="1">Option 1</Dropdown.Item>
    <Dropdown.Item eventKey="2">Option 2</Dropdown.Item>
    <Dropdown.Item eventKey="3">Option 3</Dropdown.Item>
  </DropdownButton>
</td>
     
      <td>{properties.remote.url}</td>
    </tr>
  );
  // return !editMode ? (
  //   <tr key={properties.registry.uri}>
  //     <td>{properties.registry.uri}</td>
  //     <td>
  //       <code>{properties.registry.url}</code>
  //     </td>
  //     <td>
  //       <div className={styles.actionbuttonscontainer}>
  //         <div className={styles.actionbuttonslayout}>
  //           <ActionButton
  //             action="Edit"
  //             icon={faPencilAlt}
  //             color="#00A1E4"
  //             onClick={() => setEditMode(true)}
  //           />
  //           <ActionButton
  //             action="Delete"
  //             icon={faTrashAlt}
  //             color="#FF3C38"
  //             onClick={() =>
  //               deleteRegistry(
  //                 properties.registry.uri,
  //                 properties.token,
  //                 dispatch
  //               )
  //             }
  //           />
  //         </div>
  //       </div>
  //     </td>
  //   </tr>
  // ) : (
  //   <tr key={properties.registry.uri}>
  //     <td>{properties.registry.uri}</td>
  //     <td>
  //       <TableInput
  //         value={url}
  //         onChange={event => {
  //           setUrl(event.target.value);
  //         }}
  //       />
  //     </td>
  //     <td>
  //       <div className={styles.actionbuttonscontainer}>
  //         <div className={styles.actionbuttonslayout}>
  //           <ActionButton
  //             action="Save"
  //             icon={faSave}
  //             color="#1C7C54"
  //             onClick={() => {
  //               saveRegistry(
  //                 properties.registry.uri,
  //                 url,
  //                 properties.token,
  //                 dispatch
  //               );
  //               setEditMode(false);
  //             }}
  //           />
  //           <ActionButton
  //             action="Cancel"
  //             icon={faTimesCircle}
  //             color="#888"
  //             onClick={() => {
  //               setUrl(properties.registry.url);
  //               setEditMode(false);
  //             }}
  //           />
  //         </div>
  //       </div>
  //     </td>
  //   </tr>
  // );
}

const TypeOptions = [
    "-----", 'ICE', 'BENCHLING'
  ];

const deleteRegistry = async (uri, token, dispatch) => {
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

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: parameters
  });

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
  return (string1.toLowerCase() > string2.toLowerCase() && 1) || -1;
};

const sortMethods = {
  uri: (registry1, registry2) => compareStrings(registry1.uri, registry2.uri),
  url: (registry1, registry2) => compareStrings(registry1.url, registry2.url)
};

const useRegistries = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/remotes`, token, dispatch],
    fetcher
  );
  return {
    registries: data,
    loading: !error && !data,
    error: error
  };
};

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
      error.customMessage = 'Error fetching registries';
      error.fullUrl = url;
      dispatch(addError(error));
    });
