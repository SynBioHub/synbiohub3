import { faKey, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import getConfig from 'next/config';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import InputField from '../components/Login/InputField';
import TopLevel from '../components/TopLevel';
import { addError, logoutUser, updateUser } from '../redux/actions';
import styles from '../styles/login.module.css';
import useSynBioHubVersion from '../utilities/useSynBioHubVersion';

const { publicRuntimeConfig } = getConfig();

function ChangePassword({ sbhVersion }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const loggedIn = useSelector(state => state.user.loggedIn);
  const name = useSelector(state => state.user.name);
  const email = useSelector(state => state.user.email);
  const affiliation = useSelector(state => state.user.affiliation);

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSbh3 = sbhVersion === 3;
  const queryToken = useMemo(() => {
    const raw = router.query.token;
    if (!raw) return '';
    return (Array.isArray(raw) ? raw[0] : raw) || '';
  }, [router.query.token]);

  // SBH3 email-reset: token in URL (or public visit) — clear any prior session.
  // Logged-in password change from /profile keeps the session.
  const isTokenResetFlow = isSbh3 && (!!queryToken || !loggedIn);

  useLayoutEffect(() => {
    if (isTokenResetFlow) dispatch(logoutUser());
  }, [dispatch, isTokenResetFlow]);

  // SBH1: password change is logged-in only.
  useEffect(() => {
    if (!isSbh3 && !loggedIn) {
      router.replace(`/login?next=${encodeURIComponent('/change-password')}`);
    }
  }, [isSbh3, loggedIn, router]);

  useEffect(() => {
    if (queryToken) setToken(queryToken);
  }, [queryToken]);

  if (!isSbh3 && !loggedIn) {
    return null;
  }

  const showTokenField = isTokenResetFlow;

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
          {showTokenField
            ? 'Enter the token from your reset email and your new password'
            : 'Enter your new password'}
        </div>
        {showTokenField && (
          <InputField
            value={token}
            onChange={event => setToken(event.target.value)}
            onKeyPress={() => {}}
            placeholder="Token from email"
            type="text"
            icon={faKey}
          />
        )}
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
            if (!password) {
              alert('Please enter a new password.');
              return;
            }
            if (password !== confirmPassword) {
              alert('Passwords do not match.');
              return;
            }

            if (!showTokenField) {
              const ok = await dispatch(
                updateUser(name || '', affiliation || '', email || '', password, confirmPassword)
              );
              if (ok) {
                alert('Your password was updated successfully.');
                setPassword('');
                setConfirmPassword('');
                router.push('/profile');
              }
              return;
            }

            const trimmedToken = token.trim();
            if (!trimmedToken) {
              alert('Please enter the token from your email.');
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
                alert('Your password was updated successfully. Please sign in.');
                setPassword('');
                setConfirmPassword('');
                router.push('/login');
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
          {showTokenField ? (
            <>
              <div className={styles.info}>
                <Link href="/login">
                  <a className={styles.blue}>Back to sign in</a>
                </Link>
              </div>
              <div className={styles.info}>
                <Link href="/forgot-password">
                  <a className={styles.blue}>Request a new reset link</a>
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.info}>
              <Link href="/profile">
                <a className={styles.blue}>Back to profile</a>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordWrapped() {
  const sbhVersion = useSynBioHubVersion();
  const loggedIn = useSelector(state => state.user.loggedIn);
  const router = useRouter();
  const hasToken = !!(
    router.query.token &&
    (Array.isArray(router.query.token) ? router.query.token[0] : router.query.token)
  );

  if (sbhVersion == null) {
    return (
      <TopLevel publicPage={true}>
        <div className={styles.container} />
      </TopLevel>
    );
  }

  // Public only for SBH3 email-reset (token link or anonymous visit).
  const publicPage = sbhVersion === 3 && (hasToken || !loggedIn);

  return (
    <TopLevel publicPage={publicPage}>
      <ChangePassword sbhVersion={sbhVersion} />
    </TopLevel>
  );
}
