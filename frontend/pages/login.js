import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TopLevel from '../components/TopLevel';
import { login } from '../redux/actions';
import styles from '../styles/login.module.css';

/**
 * This page renders the login page for sbh
 */
function Login() {
  const loggedIn = useSelector(state => state.user.loggedIn);
  const loginError = useSelector(state => state.user.loginError);
  const loginErrorMessage = useSelector(state => state.user.loginErrorMessage);
  const pageVisited = useSelector(state => state.tracking.pageVisited);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();

  const next = router.query.next;

  const passwordInput = useRef();

  useEffect(() => {
    if (loggedIn) {
      if (pageVisited) next ? router.replace(next) : router.back();
      else router.push('/');
    }
  }, [loggedIn, pageVisited, router]);

  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <Image
          alt="logo"
          src="/images/logo_secondary.svg"
          width={80}
          height={80}
        />
        <h1 className={styles.header}>Welcome Back</h1>
        <div className={styles.intro}>
          Sign in to view, submit, and share your genetic designs.
        </div>
        {loginError && (
          <div className={styles.warning}>{loginErrorMessage}</div>
        )}
        <input
          value={username}
          onChange={event => setUsername(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') passwordInput.current.focus();
          }}
          autoFocus
          className={styles.input}
          placeholder="Email or Username"
          type="text"
        />
        <input
          value={password}
          ref={passwordInput}
          onChange={event => setPassword(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') {
              dispatch(login(username, password));
              setUsername('');
              setPassword('');
            }
          }}
          className={styles.input}
          placeholder="Password"
          type="password"
        />
        <div
          role="button"
          className={styles.submitbutton}
          onClick={() => {
            dispatch(login(username, password));
            setUsername('');
            setPassword('');
          }}
        >
          <FontAwesomeIcon
            icon={faSignInAlt}
            size="1x"
            className={styles.submiticon}
          />{' '}
          Sign in
        </div>
        <div className={styles.infocontainer}>
          <div className={styles.info}>
            <span className={styles.blue}>Forgot password?</span>
          </div>
          <div className={styles.info}>
            New to SynBioHub? <span className={styles.blue}>Join now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginWrapped() {
  return (
    <TopLevel publicPage={true}>
      <Login />
    </TopLevel>
  );
}
