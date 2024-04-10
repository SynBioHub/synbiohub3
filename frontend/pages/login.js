import { faLock, faSignInAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import InputField from '../components/Login/InputField';
import TopLevel from '../components/TopLevel';
import { login } from '../redux/actions';
import styles from '../styles/login.module.css';

import { useTheme } from '../../frontend/components/Admin/Theme';


/**
 * This page renders the login page for sbh
 */
function Login() {
  const loggedIn = useSelector(state => state.user.loggedIn);
  const loginError = useSelector(state => state.user.loginError);
  const loginErrorMessage = useSelector(state => state.user.loginErrorMessage);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();

  const { theme} = useTheme();

  const next = router.query.next;

  const passwordInput = useRef(null);

  useEffect(() => {
    if (loggedIn) {
      if (next) router.replace(next);
      else router.push('/');
    }
  }, [loggedIn, router, next]);

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
          Sign in to view, submit, and share your genetic designs
        </div>
        {loginError && (
          <div className={styles.warning}>{loginErrorMessage}</div>
        )}
        <InputField
          value={username}
          onChange={event => setUsername(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') passwordInput.current.focus();
          }}
          placeholder="Username or Email"
          type="text"
          icon={faUser}
        />
        <InputField
          value={password}
          inputRef={passwordInput}
          onChange={event => setPassword(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') {
              dispatch(login(username, password));
              setUsername('');
              setPassword('');
            }
          }}
          placeholder="Password"
          type="password"
          icon={faLock}
        />
        <div
          role="button"
          className={styles.submitbutton}
          style={{
            backgroundColor: theme?.themeParameters?.[0]?.value || '#333', // Use theme color or default to #333
            color: theme?.themeParameters?.[1]?.value || '#fff', // Use text color from theme or default to #fff
          }} 
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
            New to SynBioHub?{' '}
            <Link href="/register">
              <a className={styles.blue}>Join now</a>
            </Link>
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
