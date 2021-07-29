import {
  faEnvelope,
  faGlassCheers,
  faLock,
  faSignInAlt,
  faSuitcase,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/dist/client/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import InputField from '../components/LoginComponents/InputField';
import TopLevel from '../components/TopLevel';
import { registerUser } from '../redux/actions';
import styles from '../styles/login.module.css';

function Register() {
  const loggedIn = useSelector(state => state.user.loggedIn);
  const registerError = useSelector(state => state.user.registerError);
  const registerErrorMessage = useSelector(
    state => state.user.registerErrorMessage
  );
  const pageVisited = useSelector(state => state.tracking.pageVisited);

  const dispatch = useDispatch();
  const router = useRouter();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const usernameInput = useRef();
  const affiliationInput = useRef();
  const emailInput = useRef();
  const passwordInput = useRef();
  const confirmPasswordInput = useRef();

  const next = router.query.next;

  useEffect(() => {
    if (loggedIn) {
      if (pageVisited) next ? router.replace(next) : router.back();
      else router.push('/');
    }
  }, [loggedIn, pageVisited, router]);

  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <FontAwesomeIcon
          icon={faGlassCheers}
          size="3x"
          color="#00A1E4"
          className={styles.registericon}
        />
        <h1 className={styles.header}>Create Your Account</h1>
        <div className={styles.intro}>
          Tell us about yourself to get started
        </div>
        {registerError && (
          <div className={styles.warning}>{registerErrorMessage}</div>
        )}
        <InputField
          value={name}
          onChange={event => setName(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') usernameInput.current.focus();
          }}
          placeholder="Full name"
          type="text"
          icon={faUser}
        />
        <InputField
          value={username}
          inputRef={usernameInput}
          onChange={event => setUsername(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') affiliationInput.current.focus();
          }}
          placeholder="Username"
          type="text"
          icon={faUser}
        />
        <InputField
          value={affiliation}
          inputRef={affiliationInput}
          onChange={event => setAffiliation(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') emailInput.current.focus();
          }}
          placeholder="Affiliation (optional)"
          type="text"
          icon={faSuitcase}
        />
        <InputField
          value={email}
          inputRef={emailInput}
          onChange={event => setEmail(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') passwordInput.current.focus();
          }}
          placeholder="Email"
          type="text"
          icon={faEnvelope}
        />
        <InputField
          value={password}
          inputRef={passwordInput}
          onChange={event => setPassword(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') confirmPasswordInput.current.focus();
          }}
          placeholder="Password"
          type="password"
          icon={faLock}
        />
        <InputField
          value={confirmPassword}
          inputRef={confirmPasswordInput}
          onChange={event => setConfirmPassword(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') {
              dispatch(
                registerUser(
                  name,
                  username,
                  affiliation,
                  email,
                  password,
                  confirmPassword
                )
              );
              setPassword('');
              setConfirmPassword('');
            }
          }}
          placeholder="Confirm password"
          type="password"
          icon={faLock}
        />
        <div
          role="button"
          className={styles.submitbutton}
          onClick={() => {
            dispatch(
              registerUser(
                name,
                username,
                affiliation,
                email,
                password,
                confirmPassword
              )
            );
            setPassword('');
            setConfirmPassword('');
          }}
        >
          <FontAwesomeIcon
            icon={faSignInAlt}
            size="1x"
            className={styles.submiticon}
          />{' '}
          Create Account
        </div>
        <div className={styles.infocontainer}>
          <div className={styles.info}>
            Already have an account?{' '}
            <Link href="/login">
              <a className={styles.blue}>Sign in</a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterWrapped() {
  return (
    <TopLevel publicPage={true}>
      <Register />
    </TopLevel>
  );
}
