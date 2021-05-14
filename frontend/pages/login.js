import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/login.module.css';
import TopLevel from '../components/TopLevel';
import { login } from '../redux/actions';

/**
 * This page renders the login page for sbh
 */
function Login() {
  const loggedIn = useSelector((state) => state.user.loggedIn);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  if (loggedIn) {
    router.back();
  }
  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <Image
          alt="login icon"
          height={40}
          src="/images/lock.svg"
          width={40}
        />
        <div className={styles.header}>Login</div>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className={styles.input} placeholder="Email or Username" type="text" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} placeholder="Password" type="password" />
        <div className={`${styles.info} ${styles.forgotpassword}`}>
          Forgot your passsword? Reset it
          {' '}
          <span className={styles.orange}>here</span>
          .
        </div>
        <div className={styles.submitbutton} onClick={() => dispatch(login(username, password))}>Submit</div>
        <div className={`${styles.info} ${styles.signup}`}>
          Need an account? Sign up
          {' '}
          <span className={styles.orange}>here</span>
          .
        </div>
      </div>
    </div>
  );
}

export default function LoginWrapped() {
  return <TopLevel><Login /></TopLevel>;
}
