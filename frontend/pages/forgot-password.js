import { faEnvelope, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import getConfig from 'next/config';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import InputField from '../components/Login/InputField';
import TopLevel from '../components/TopLevel';
import { addError, logoutUser } from '../redux/actions';
import styles from '../styles/login.module.css';
import useSynBioHubVersion from '../utilities/useSynBioHubVersion';

const { publicRuntimeConfig } = getConfig();

function ForgotPassword() {
  const dispatch = useDispatch();
  const router = useRouter();
  const sbhVersion = useSynBioHubVersion();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const theme = JSON.parse(localStorage.getItem('theme')) || {};

  // SBH1 backends: this flow is unsupported — send users to login.
  useEffect(() => {
    if (sbhVersion != null && sbhVersion !== 3) {
      router.replace('/login');
    }
  }, [sbhVersion, router]);

  useLayoutEffect(() => {
    if (sbhVersion === 3) dispatch(logoutUser());
  }, [dispatch, sbhVersion]);

  const submitResetRequest = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      alert('Please enter your email address.');
      return;
    }

    const parameters = new URLSearchParams();
    parameters.append('email', trimmed);

    const url = `${publicRuntimeConfig.backend}/resetPassword`;
    setSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post(url, parameters, {
        headers: {
          Accept: 'text/plain',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (response.status === 200) {
        setMessage(
          typeof response.data === 'string' && response.data.trim()
            ? response.data
            : 'If an account exists for that email, a password reset link has been sent.'
        );
        setEmail('');
      }
    } catch (error) {
      const serverMessage =
        error.response && typeof error.response.data === 'string'
          ? error.response.data
          : null;
      if (serverMessage) {
        setMessage(serverMessage);
      } else {
        error.customMessage =
          'Request failed for POST /resetPassword. Check your email and try again.';
        error.url = url;
        dispatch(addError(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sbhVersion == null || sbhVersion !== 3) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        <FontAwesomeIcon
          icon={faEnvelope}
          size="3x"
          color="#00A1E4"
          className={styles.registericon}
        />
        <h1 className={styles.header}>Forgot password</h1>
        <div className={styles.intro}>
          Enter your account email and we will send a reset link if it matches
          an account
        </div>
        {message && <div className={styles.warning}>{message}</div>}
        <InputField
          value={email}
          onChange={event => setEmail(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter' && !submitting) submitResetRequest();
          }}
          placeholder="Email"
          type="email"
          icon={faEnvelope}
        />
        <div
          role="button"
          className={styles.submitbutton}
          style={{
            backgroundColor: theme?.themeParameters?.[0]?.value || '#333',
            color: theme?.themeParameters?.[1]?.value || '#fff',
            opacity: submitting ? 0.7 : 1
          }}
          onClick={() => {
            if (!submitting) submitResetRequest();
          }}
        >
          <FontAwesomeIcon
            icon={faPaperPlane}
            size="1x"
            className={styles.submiticon}
          />{' '}
          {submitting ? 'Sending…' : 'Send reset link'}
        </div>
        <div className={styles.infocontainer}>
          <div className={styles.info}>
            <Link href="/login">
              <a className={styles.blue}>Back to sign in</a>
            </Link>
          </div>
          <div className={styles.info}>
            Already have a token?{' '}
            <Link href="/change-password">
              <a className={styles.blue}>Set a new password</a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordWrapped() {
  return (
    <TopLevel publicPage={true}>
      <ForgotPassword />
    </TopLevel>
  );
}
