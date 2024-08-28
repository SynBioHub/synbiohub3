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
// const { publicRuntimeConfig } = getConfig();
import backendUrl from '../GetUrl/GetBackend';

/* eslint sonarjs/cognitive-complexity: "off" */

const searchable = ['uri', 'url'];
const headers = ['ID', 'Type', 'URL', ''];

/* eslint sonarjs/no-duplicate-string: "off" */

export default function Remotes() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const { registries, loading } = useRegistries(token, dispatch);

  return (
    <div className={styles.plugintable}>
      <Dropdown />
      <Table
        data={registries ? registries.remotes : undefined}
        loading={loading}
        title="Remotes"
        searchable={searchable}
        headers={headers}
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

  // useEffect(() => {
  //   setUrl(properties.registry.url);
  // }, [properties.registry.url]);
  if (!properties.remote) return null;

  return (
    <tr>
      <td>{properties.remote.id}</td>

      <td>
        {/* <DropdownButton title="Select an option" id="dropdown-menu">
    <Dropdown.Item eventKey="1">Option 1</Dropdown.Item>
    <Dropdown.Item eventKey="2">Option 2</Dropdown.Item>
    <Dropdown.Item eventKey="3">Option 3</Dropdown.Item>
  </DropdownButton> */}
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

function Dropdown() {
  const [selectedType, setSelectedType] = useState(TypeOptions[0]);

  const handleChange = (event) => {
    setSelectedType(event.target.value);
  };

  return (
    <div>
      <select value={selectedType} onChange={handleChange}>
        {TypeOptions.map((type, index) => (
          <option key={index} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}


// const compareStrings = (string1, string2) => {
//   if (!string1 && !string2) return 0; // Both strings are undefined or null, they are equal
//   if (!string1) return -1; // Only string1 is undefined or null, string1 is less
//   if (!string2) return 1;  // Only string2 is undefined or null, string1 is greater

//   const lowerString1 = string1.toLowerCase();
//   const lowerString2 = string2.toLowerCase();

//   return (lowerString1 > lowerString2 && 1) || (lowerString1 < lowerString2 && -1) || 0;
// };

// const sortMethods = {
//   uri: (registry1, registry2) => compareStrings(registry1.uri, registry2.uri),
//   url: (registry1, registry2) => compareStrings(registry1.url, registry2.url)
// };

const useRegistries = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${backendUrl}/admin/remotes`, token, dispatch],
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
      error.customMessage = 'Error fetching remotes';
      error.fullUrl = url;
      dispatch(addError(error));
    });
