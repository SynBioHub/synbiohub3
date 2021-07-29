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

import InputField from '../components/LoginComponents/InputField';
import TopLevel from '../components/TopLevel';
import { updateUser } from '../redux/actions';
import styles from '../styles/login.module.css';

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
    </div>
  );
}

export default function ProfileWrapped() {
  return (
    <TopLevel>
      <Profile />
    </TopLevel>
  );
}
