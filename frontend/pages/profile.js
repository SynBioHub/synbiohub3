import { faIdCard } from '@fortawesome/free-regular-svg-icons';
import {
  faEnvelope,
  faLock,
  faSave,
  faSuitcase,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import InputField from '../components/Login/InputField';
import TopLevel from '../components/TopLevel';
import { addError, login, logoutUser, updateUser } from '../redux/actions';
import styles from '../styles/login.module.css';
import ActionButton from '../components/Admin/Reusable/ActionButton';
import SimpleTable from '../components/Reusable/Table/SimpleTable';

function Profile() {
  const [name, setName] = useState('');
  const [unsavedName, setUnsavedName] = useState(false);
  const [affiliation, setAffiliation] = useState('');
  const [unsavedAffiliation, setUnsavedAffilation] = useState(false);
  const [email, setEmail] = useState('');
  const [unsavedEmail, setUnsavedEmail] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unsavedPassword, setUnsavedPassword] = useState(false);
  const dispatch = useDispatch();

  const profileName = useSelector(state => state.user.name);
  const profileUsername = useSelector(state => state.user.username);
  const profileAffilation = useSelector(state => state.user.affiliation);
  const profileEmail = useSelector(state => state.user.email);

  useEffect(() => {
    setName(profileName);
    setAffiliation(profileAffilation);
    setEmail(profileEmail);
  }, [profileName, profileUsername, profileAffilation, profileEmail]);

  useEffect(() => {
    setUnsavedName(name !== profileName);
    setUnsavedAffilation(affiliation !== profileAffilation);
    setUnsavedEmail(email !== profileEmail);
    setUnsavedPassword(password || confirmPassword ? true : false);
  }, [
    name,
    profileName,
    affiliation,
    profileAffilation,
    email,
    profileEmail,
    password,
    confirmPassword
  ]);
  const token = useSelector(state => state.user.token);
  // const { plugins, loading } = loadPluginData(token);
  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <FontAwesomeIcon
          icon={faIdCard}
          size="3x"
          color="#00A1E4"
          className={styles.registericon}
        />
        <h1 className={styles.header}>
          {profileUsername}
          {"'s"} Account
        </h1>
        <div className={styles.intro}>
          View and update details about your profile
        </div>
        <InputField
          value={name}
          onChange={event => setName(event.target.value)}
          onKeyPress={() => {}}
          placeholder="Full name"
          type="text"
          icon={faUser}
          highlight={unsavedName}
        />
        <InputField
          value={affiliation}
          onChange={event => setAffiliation(event.target.value)}
          onKeyPress={() => {}}
          placeholder="Affiliation (optional)"
          type="text"
          icon={faSuitcase}
          highlight={unsavedAffiliation}
        />
        <InputField
          value={email}
          onChange={event => setEmail(event.target.value)}
          onKeyPress={() => {}}
          placeholder="Email"
          type="text"
          icon={faEnvelope}
          highlight={unsavedEmail}
        />
        <InputField
          value={password}
          onChange={event => setPassword(event.target.value)}
          onKeyPress={() => {}}
          placeholder="New password (optional)"
          type="password"
          icon={faLock}
          highlight={unsavedPassword}
        />
        <InputField
          value={confirmPassword}
          onChange={event => setConfirmPassword(event.target.value)}
          onKeyPress={() => {}}
          placeholder="Confirm new password"
          type="password"
          icon={faLock}
          highlight={unsavedPassword}
        />
        <div
          role="button"
          className={styles.submitbutton}
          onClick={() => {
            dispatch(
              updateUser(name, affiliation, email, password, confirmPassword)
            );
            setPassword('');
            setConfirmPassword('');
          }}
        >
          <FontAwesomeIcon
            icon={faSave}
            size="1x"
            className={styles.submiticon}
            color="#D25627"
          />{' '}
          Save Information
        </div>
        <div className={styles.infocontainer}>
          <div className={styles.info}></div>
        </div>
      </div>
      {/* <div>
        <PluginTable
          token={token}
          title="Authorization"
          type=""
          loading=""
          data={[]}
        />
      </div> */}
    </div>
  );
}

function PluginTable(properties) {
  const [fetchedData, setFetchedData] = useState([]);
  const dispatch = useDispatch();
  useEffect(() => {
    const getData = async () => {
      const url = 'http://localhost:6789/plugin/servers';
      try {
        const data = await axios.get(url);
        setFetchedData(data);
      } catch (error) {
        error.customMessage =
          'Request and/or processing failed for GET /plugin/servers';
        error.fullUrl = url;
        dispatch(addError(error));
      }
    };
    getData();
  }, []);
  return (
    <div className={styles.plugintable}>
      <SimpleTable
        data={fetchedData}
        loading={properties.loading}
        title={properties.title}
        hideFooter={true}
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

function PluginDisplay(properties) {
  const [name, setName] = useState(properties.plugin.name);
  const [url, setUrl] = useState(properties.plugin.url);

  useEffect(() => {
    setName(properties.plugin.name);
    setUrl(properties.plugin.url);
  }, [properties.plugin.name, properties.plugin.url]);

  return (
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
              action="Login"
              icon={faPencilAlt}
              color="#00A1E4"
              onClick={() => login()}
            />
            <ActionButton
              action="Logout"
              icon={faTrashAlt}
              color="#FF3C38"
              onClick={() => logoutUser()}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}

// this.state = {
//   username: "",
//   loggedin: false,
//   message: "",
//   gameStarted: false,
// };

var state = {
  data: ''
};

const loadPluginData = token => {
  var axiosresult;
  axios.get(temp).then(res => {
    axiosresult = res.data;
  });

  // const axiostemp = await axios({
  //   method: 'get',
  //   url: temp,

  // }).then(response => {
  //     axiosresult = response.data;
  // });
  // var result = fetcher(temp, token);
  // const { data, error } = useSWR(
  //   [`${publicRuntimeConfig.backend}/plugin/servers`, token],
  //   fetcher
  // );
  // return {
  //   plugins: result,
  //   loading: !error && !data,
  //   error: error
  // };
  return {
    plugins: axiosresult,
    loading: false
  };
};

const fetcher = (url, token) => {
  axios
    .get(url, {
      // headers: {
      //   'Content-Type': 'application/json',
      //   Accept: 'text/plain',
      //   'X-authorization': token
      // }
    })
    .then(response => response.data);
};

export default function ProfileWrapped() {
  return (
    <TopLevel>
      <Profile />
    </TopLevel>
  );
}
