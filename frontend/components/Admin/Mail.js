import { faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR, { mutate } from 'swr';
const { publicRuntimeConfig } = getConfig();

import styles from '../../styles/admin.module.css';
import InputField from '../Login/InputField';
import Loading from '../Reusable/Loading';
import ErrorMessage from './Reusable/ErrorMessage';
import SaveButton from './Reusable/SaveButton';
import { addError } from '../../redux/actions';

function normalizeMailResponse(data) {
  let raw = data;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { sendgridApiKey: '', fromAddress: '' };
    }
  }
  if (!raw || typeof raw !== 'object') {
    return { sendgridApiKey: '', fromAddress: '' };
  }
  return {
    sendgridApiKey: raw.sendgridApiKey ?? raw.sendGridApiKey ?? '',
    fromAddress: raw.fromAddress ?? raw.sendGridFromEmail ?? ''
  };
}

function maskSendGridKey(key) {
  if (!key) return 'Not configured';
  const s = String(key);
  if (s.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(12, s.length - 4))}…${s.slice(-4)}`;
}

export default function Mail() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const [apiKey, setApiKey] = useState('');
  const [sendGridEmail, setSendGridEmail] = useState('');
  const { email, loading } = useEmail(token, dispatch);
  const [error, setError] = useState('');

  const [actualApiKey, setActualApiKey] = useState('');
  const [actualSendGridEmail, setActualSendGridEmail] = useState('');

  const [unsavedApiKey, setUnsavedApiKey] = useState(false);
  const [unsavedSendGridEmail, setUnsavedSendGridEmail] = useState(false);

  useEffect(() => {
    if (email) {
      const { sendgridApiKey, fromAddress } = normalizeMailResponse(email);
      setActualApiKey(sendgridApiKey);
      setActualSendGridEmail(fromAddress);
    }
  }, [email]);

  useEffect(() => {
    setUnsavedApiKey(apiKey.trim().length > 0);
    setUnsavedSendGridEmail(sendGridEmail.trim().length > 0);
  }, [apiKey, sendGridEmail]);

  if (loading) {
    return <Loading />;
  } else if (email) {
    return (
      <div className={styles.mailcontainer}>
        <h2 className={styles.mailheader}>SendGrid Configuration</h2>
        {error && <ErrorMessage message={error} />}
        <div className={styles.mailLayout}>
          <aside className={styles.mailCurrentPanel} aria-label="Current mail settings">
            <h3>Current settings</h3>
            <p className={styles.mailCurrentIntro}>
              Values saved on the server. The API key is masked; the form on the right is for
              updates.
            </p>
            <div className={styles.mailCurrentLabel}>From address</div>
            <p className={styles.mailCurrentValue}>
              {actualSendGridEmail ? actualSendGridEmail : 'Not configured'}
            </p>
            <div className={styles.mailCurrentLabel}>SendGrid API key</div>
            <p className={styles.mailCurrentValue}>{maskSendGridKey(actualApiKey)}</p>
          </aside>
          <div className={styles.mailFormPanel}>
            <p>SendGrid Email Address</p>
            <InputField
              value={sendGridEmail}
              onChange={event => setSendGridEmail(event.target.value)}
              placeholder="noreply@example.org"
              type="text"
              onKeyPress={() => {}}
              highlight={unsavedSendGridEmail}
              icon={faEnvelope}
            />
            <p>SendGrid API Key</p>
            <InputField
              value={apiKey}
              onChange={event => setApiKey(event.target.value)}
              placeholder="SG.xxxxxxxx"
              type="text"
              onKeyPress={() => {}}
              highlight={unsavedApiKey}
              icon={faKey}
            />
            <div className={styles.savebuttoncontainer}>
              <SaveButton
                onClick={() =>
                  updateEmail(
                    apiKey,
                    sendGridEmail,
                    token,
                    setError,
                    setApiKey,
                    setSendGridEmail,
                    dispatch
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return <div>Error</div>;
  }
}

const useEmail = (token, dispatch) => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/mail`, token, dispatch],
    fetcher
  );
  return {
    email: data,
    loading: !error && !data,
    error: error
  };
};

const fetcher = (url, token, dispatch) =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
    .then(response => normalizeMailResponse(response.data))
    .catch(error => {
      error.customMessage = 'Error fetching email';
      error.fullUrl = url;
      dispatch(addError(error));
    });

const updateEmail = async (
  apiKey,
  address,
  token,
  setError,
  setApiKey,
  setSendGridEmail,
  dispatch
) => {
  const url = `${publicRuntimeConfig.backend}/admin/mail`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  const parameters = new URLSearchParams();
  parameters.append('key', apiKey);
  parameters.append('fromEmail', address);

  let response;

  try {
    response = await axios.post(url, parameters, { headers });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.message);
    }
    const data = error.response?.data;
    const message =
      typeof data === 'string' ? data : error.message || 'Update failed';
    setError(message);
    setApiKey('');
    setSendGridEmail('');
    alert(`Could not save mail settings: ${message}`);
    return;
  }

  if (!response || response.status !== 200) {
    const message =
      typeof response?.data === 'string' ? response.data : 'Update failed';
    setError(message);
    setApiKey('');
    setSendGridEmail('');
    alert(`Could not save mail settings: ${message}`);
    return;
  }

  setError('');
  const successMessage =
    typeof response.data === 'string' ? response.data : 'Mail settings updated.';
  alert(successMessage);
  setApiKey('');
  setSendGridEmail('');
  mutate([`${publicRuntimeConfig.backend}/admin/mail`, token, dispatch]);
};
