import { faIdCard } from '@fortawesome/free-regular-svg-icons';
import {
  faEnvelope,
  faLock,
  faSave,
  faSuitcase,
  faUser,
  faIdBadge
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import InputField from '../components/Login/InputField';
import TopLevel from '../components/TopLevel';
import { isValidEmail } from '../lib/emailValidation';
import { updateUser } from '../redux/actions';
import styles from '../styles/login.module.css';

function Profile() {
  const [name, setName] = useState('');
  const [unsavedName, setUnsavedName] = useState(false);
  const [affiliation, setAffiliation] = useState('');
  const [unsavedAffiliation, setUnsavedAffilation] = useState(false);
  const [email, setEmail] = useState('');
  const [unsavedEmail, setUnsavedEmail] = useState(false);
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
  }, [name, profileName, affiliation, profileAffilation, email, profileEmail]);
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
          {name}
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
          value={profileUsername}
          onChange={() => {}}
          onKeyPress={() => {}}
          placeholder="Username"
          type="text"
          icon={faIdBadge}
          readOnly
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
        <div
          role="button"
          className={styles.submitbutton}
          onClick={async () => {
            const trimmedEmail = email.trim();
            if (!isValidEmail(trimmedEmail)) {
              alert('Please enter a valid email address.');
              return;
            }
            const ok = await dispatch(
              updateUser(name, affiliation, trimmedEmail, '', '')
            );
            if (ok) {
              alert('Your profile was updated successfully.');
            }
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
        <Link href="/change-password">
          <a className={styles.profileSecondaryLink}>
            <FontAwesomeIcon
              icon={faLock}
              className={styles.profileSecondaryIcon}
            />
            Change password
          </a>
        </Link>
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
