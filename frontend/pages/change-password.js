import { faKey, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import getConfig from 'next/config';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import InputField from '../components/Login/InputField';
import TopLevel from '../components/TopLevel';
import { addError } from '../redux/actions';
import styles from '../styles/login.module.css';

const { publicRuntimeConfig } = getConfig();

function ChangePassword() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const raw = router.query.token;
    if (!raw) return;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) setToken(value);
  }, [router.query.token]);

  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <FontAwesomeIcon
          icon={faLock}
          size="3x"
          color="#00A1E4"
          className={styles.registericon}
        />
        <h1 className={styles.header}>Change password</h1>
        <div className={styles.intro}>
          Enter the token from your reset email and your new password
        </div>
        <InputField
          value={token}
          onChange={event => setToken(event.target.value)}
          onKeyPress={() => {}}
          placeholder="Token from email"
          type="text"
          icon={faKey}
        />
        <InputField
          value={password}
          onChange={event => setPassword(event.target.value)}
          onKeyPress={() => {}}
          placeholder="New password"
          type="password"
          icon={faLock}
        />
        <InputField
          value={confirmPassword}
          onChange={event => setConfirmPassword(event.target.value)}
          onKeyPress={() => {}}
          placeholder="Confirm new password"
          type="password"
          icon={faLock}
        />
        <div
          role="button"
          className={styles.submitbutton}
          onClick={async () => {
            const trimmedToken = token.trim();
            if (!trimmedToken) {
              alert('Please enter the token from your email.');
              return;
            }
            if (!password) {
              alert('Please enter a new password.');
              return;
            }
            if (password !== confirmPassword) {
              alert('Passwords do not match.');
              return;
            }

            const parameters = new URLSearchParams();
            parameters.append('token', trimmedToken);
            parameters.append('password1', password);
            parameters.append('password2', confirmPassword);

            const url = `${publicRuntimeConfig.backend}/setNewPassword`;

            try {
              const response = await axios.post(url, parameters, {
                headers: {
                  Accept: 'text/plain',
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              });
              if (response.status === 200) {
                alert('Your password was updated successfully.');
                setPassword('');
                setConfirmPassword('');
              }
            } catch (error) {
              if (error.response) {
                console.error('Error:', error.message);
              }
              error.customMessage =
                'Request failed for POST /setNewPassword. Check your token and try again.';
              error.url = url;
              dispatch(addError(error));
            }
          }}
        >
          <FontAwesomeIcon
            icon={faLock}
            size="1x"
            className={styles.submiticon}
            color="#D25627"
          />{' '}
          Update password
        </div>
        <div className={styles.infocontainer}>
          <Link href="/profile">
            <a className={styles.blue}>Back to profile</a>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordWrapped() {
  return (
    <TopLevel>
      <ChangePassword />
    </TopLevel>
  );
}
