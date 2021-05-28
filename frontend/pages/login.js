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

  const passwordInput = useRef();

  useEffect(() => {
    if (loggedIn) {
      if (pageVisited) router.back();
      else router.push('/');
    }
  }, [loggedIn, pageVisited, router]);

  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <Image alt="login icon" height={40} src="/images/lock.svg" width={40} />
        <div className={styles.header}>Login</div>
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
        <div className={`${styles.info} ${styles.forgotpassword}`}>
          Forgot your passsword? Reset it{' '}
          <span className={styles.orange}>here</span>.
        </div>
        <div
          role="button"
          className={styles.submitbutton}
          onClick={() => {
            dispatch(login(username, password));
            setUsername('');
            setPassword('');
          }}
        >
          Submit
        </div>
        <div className={`${styles.info} ${styles.signup}`}>
          Need an account? Sign up <span className={styles.orange}>here</span>.
        </div>
      </div>
    </div>
  );
}

export default function LoginWrapped() {
  return (
    <TopLevel>
      <Login />
    </TopLevel>
  );
}
