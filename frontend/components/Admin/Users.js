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
import Checkbox from './Reusable/CheckBox';
import TableInput from './Reusable/TableInput';
import { addError } from '../../redux/actions';
const { publicRuntimeConfig } = getConfig();

/* eslint sonarjs/cognitive-complexity: "off" */

const searchable = ['id', 'name', 'username', 'email', 'affiliation'];
const headers = [
  'ID',
  'Username',
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
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const dispatch = useDispatch();
  const { users, loading } = useUsers(token, dispatch);

  const [allowPublicSignup, setAllowPublicSignup] = useState(theme.allowPublicSignup);

  useEffect(() => {
    const storedTheme = JSON.parse(localStorage.getItem('theme')) || {};
    if (storedTheme.allowPublicSignup !== undefined) {
      setAllowPublicSignup(storedTheme.allowPublicSignup);
    }
  }, []);

  const handleAllowPublicSignup = async () => {
    try {
      const url = `${publicRuntimeConfig.backend}/admin/users`;
      const headers = {
        Accept: 'text/plain',
        'X-authorization': token,
      };

      const parameters = new URLSearchParams();
      if (allowPublicSignup) {
        parameters.append('allowPublicSignup', allowPublicSignup);
      }

      const response = await axios.post(url, parameters, { headers });

      if (response.status === 200) {
        alert("Allow Public Account Creation updated successfully!");
        const updatedTheme = {
          ...JSON.parse(localStorage.getItem('theme')),
          allowPublicSignup: allowPublicSignup,
        };
        localStorage.setItem('theme', JSON.stringify(updatedTheme));
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  return (
    <div>
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
          finalRow={<NewUserRow token={token} />}
          dataRowDisplay={user => (
            <UserDisplay key={user.id} user={user} token={token} />
          )}
        />
      </div>
      <div className={styles.checkbox}>
        <Checkbox
          value={allowPublicSignup}
          onChange={() => setAllowPublicSignup(prevState => !prevState)}
        />
        <span className={styles.checktext}>Allow Public Account Creation</span>
        <ActionButton className={styles.checksave}
          action="Save"
          icon={faSave}
          color="#1C7C54"
          onClick={handleAllowPublicSignup}
        />
      </div>
    </div>

  );
}

function NewUserRow(properties) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [member, setMember] = useState(false);
  const [curator, setCurator] = useState(false);
  const [admin, setAdmin] = useState(false);
  const dispatch = useDispatch();
  return (
    <tr key="New">
      <td>New</td>
      <td>
        <TableInput
          value={username}
          onChange={event => setUsername(event.target.value)}
          placeholder="Username"
        />
      </td>
      <td>
        <TableInput
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Name"
        />
      </td>
      <td>
        <TableInput
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="Email"
        />
      </td>
      <td>
        <TableInput
          value={affiliation}
          onChange={event => setAffiliation(event.target.value)}
          placeholder="Affiliation"
        />
      </td>
      <td>
        <Checkbox value={member} onChange={() => setMember(!member)} />
      </td>
      <td>
        <Checkbox value={curator} onChange={() => setCurator(!curator)} />
      </td>
      <td>
        <Checkbox value={admin} onChange={() => setAdmin(!admin)} />
      </td>
      <td>
        <div className={styles.actionbuttonscontainer}>
          <div className={styles.actionbuttonslayout}>
            <ActionButton
              action="Create"
              icon={faPlusCircle}
              color="#1C7C54"
              onClick={() => {
                createUser(
                  username,
                  name,
                  email,
                  affiliation,
                  member,
                  curator,
                  admin,
                  properties.token,
                  dispatch
                );
                setUsername('');
                setName('');
                setEmail('');
                setAffiliation('');
                setMember(false);
                setCurator(false);
                setAdmin(false);
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
  const [email, setEmail] = useState(properties.user.email);
  const [affiliation, setAffiliation] = useState(properties.user.affiliation);
  const [isMember, setIsMember] = useState(
    properties.user.isMember ? true : false
  );
  const [isCurator, setIsCurator] = useState(
    properties.user.isCurator ? true : false
  );
  const [isAdmin, setIsAdmin] = useState(
    properties.user.isAdmin ? true : false
  );

  const dispatch = useDispatch();

  useEffect(() => {
    setName(properties.user.name);
    setEmail(properties.user.email);
  }, [properties.user.name, properties.user.url]);

  return !editMode ? (
    <tr key={properties.user.id}>
      <td>{properties.user.id}</td>
      <td>{properties.user.username}</td>
      <td>{properties.user.name}</td>
      <td>
        <code>{properties.user.email}</code>
      </td>
      <td>{properties.user.affiliation}</td>
      <td>
        <Checkbox
          value={properties.user.isMember ? true : false}
          permanent={true}
        />
      </td>
      <td>
        <Checkbox
          value={properties.user.isCurator ? true : false}
          permanent={true}
        />
      </td>
      <td>
        <Checkbox
          value={properties.user.isAdmin ? true : false}
          permanent={true}
        />
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
                deleteUser(properties.user.id, properties.token, dispatch)
              }
            />
          </div>
        </div>
      </td>
    </tr>
  ) : (
    <tr key={properties.user.id}>
      <td>{properties.user.id}</td>
      <td>{properties.user.username}</td>
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
          value={affiliation}
          onChange={event => {
            setAffiliation(event.target.value);
          }}
        />
      </td>
      <td>
        <Checkbox value={isMember} onChange={() => setIsMember(!isMember)} />
      </td>
      <td>
        <Checkbox value={isCurator} onChange={() => setIsCurator(!isCurator)} />
      </td>
      <td>
        <Checkbox value={isAdmin} onChange={() => setIsAdmin(!isAdmin)} />
      </td>
      <td>
        <div className={styles.actionbuttonscontainer}>
          <div className={styles.actionbuttonslayout}>
            <ActionButton
              action="Save"
              icon={faSave}
              color="#1C7C54"
              onClick={() => {
                saveUser(
                  properties.user.id,
                  name,
                  email,
                  affiliation,
                  isMember,
                  isCurator,
                  isAdmin,
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
                setName(properties.user.name);
                setEmail(properties.user.email);
                setAffiliation(properties.user.affiliation);
                setIsMember(properties.user.isMember ? true : false);
                setIsCurator(properties.user.isCurator ? true : false);
                setIsAdmin(properties.user.isAdmin ? true : false);
                setEditMode(false);
              }}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}

const deleteUser = async (id, token, dispatch) => {
  const url = `${publicRuntimeConfig.backend}/admin/deleteUser`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('id', id);

  let response;

  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  if (response && response.status === 200) {
    mutate([`${publicRuntimeConfig.backend}/admin/users`, token, dispatch]);
  }
};

const saveUser = async (
  id,
  name,
  email,
  affiliation,
  isMember,
  isCurator,
  isAdmin,
  token,
  dispatch
) => {
  const url = `${publicRuntimeConfig.backend}/admin/updateUser`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('id', id);
  parameters.append('name', name);
  parameters.append('email', email);
  parameters.append('affiliation', affiliation);
  parameters.append('isMember', isMember);
  parameters.append('isCurator', isCurator);
  parameters.append('isAdmin', isAdmin);

  let response;

  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  if (response.status === 200) {
    mutate([`${publicRuntimeConfig.backend}/admin/users`, token, dispatch]);
  }
};

const createUser = async (
  username,
  name,
  email,
  affiliation,
  isMember,
  isCurator,
  isAdmin,
  token,
  dispatch
) => {
  const url = `${publicRuntimeConfig.backend}/admin/newUser`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('username', username);
  parameters.append('name', name);
  parameters.append('email', email);
  parameters.append('affiliation', affiliation);
  isMember && parameters.append('isMember', '1');
  isCurator && parameters.append('isCurator', '1');
  isAdmin && parameters.append('isAdmin', '1');

  let response;

  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
  }

  // const responseText = await response.data;

  if (response && response.status === 200) {
    mutate([`${publicRuntimeConfig.backend}/admin/users`, token, dispatch]);
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
  if (!string1 && !string2) return 0; // Both strings are undefined or null, they are equal
  if (!string1) return -1; // Only string1 is undefined or null, string1 is less
  if (!string2) return 1;  // Only string2 is undefined or null, string1 is greater

  const lowerString1 = string1.toLowerCase();
  const lowerString2 = string2.toLowerCase();

  return (lowerString1 > lowerString2 && 1) || (lowerString1 < lowerString2 && -1) || 0;
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

const useUsers = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/users`, token, dispatch],
    fetcher
  );
  return {
    users: data,
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
      error.customMessage = 'Request failed for GET /admin/users';
      error.fullUrl = url;
      dispatch(addError(error));
    });
