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
import useSynBioHubVersion from '../../utilities/useSynBioHubVersion';
import ErrorMessage from './Reusable/ErrorMessage';
import SaveButton from './Reusable/SaveButton';
import { addError } from '../../redux/actions';

function normalizeMailResponse(data) {
  let raw = data;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { apiKey: '', fromAddress: '' };
    }
  }
  if (!raw || typeof raw !== 'object') {
    return { apiKey: '', fromAddress: '' };
  }
  return {
    apiKey:
      raw.resendApiKey ??
      raw.sendgridApiKey ??
      raw.sendGridApiKey ??
      '',
    fromAddress: raw.fromAddress ?? raw.sendGridFromEmail ?? ''
  };
}

function maskApiKey(key) {
  if (!key) return 'Not configured';
  const s = String(key);
  if (s.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(12, s.length - 4))}…${s.slice(-4)}`;
}

export default function Mail() {
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();
  const sbhVersion = useSynBioHubVersion();
  const isSbh3 = sbhVersion === 3;
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const { email, loading } = useEmail(token, dispatch);
  const [error, setError] = useState('');

  const [actualApiKey, setActualApiKey] = useState('');
  const [actualFromEmail, setActualFromEmail] = useState('');

  const [unsavedApiKey, setUnsavedApiKey] = useState(false);
  const [unsavedFromEmail, setUnsavedFromEmail] = useState(false);

  useEffect(() => {
    if (email) {
      const { apiKey: key, fromAddress } = normalizeMailResponse(email);
      setActualApiKey(key);
      setActualFromEmail(fromAddress);
    }
  }, [email]);

  useEffect(() => {
    setUnsavedApiKey(apiKey.trim().length > 0);
    setUnsavedFromEmail(fromEmail.trim().length > 0);
  }, [apiKey, fromEmail]);

  if (loading || sbhVersion == null) {
    return <Loading />;
  } else if (email) {
    const providerName = isSbh3 ? 'Resend' : 'SendGrid';
    const keyPlaceholder = isSbh3 ? 're_xxxxxxxx' : 'SG.xxxxxxxx';
    return (
      <div className={styles.mailcontainer}>
        <h2 className={styles.mailheader}>{providerName} Configuration</h2>
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
              {actualFromEmail ? actualFromEmail : 'Not configured'}
            </p>
            <div className={styles.mailCurrentLabel}>{providerName} API key</div>
            <p className={styles.mailCurrentValue}>{maskApiKey(actualApiKey)}</p>
          </aside>
          <div className={styles.mailFormPanel}>
            <p>{providerName} from address</p>
            <InputField
              value={fromEmail}
              onChange={event => setFromEmail(event.target.value)}
              placeholder="noreply@example.org"
              type="text"
              onKeyPress={() => {}}
              highlight={unsavedFromEmail}
              icon={faEnvelope}
            />
            <p>{providerName} API key</p>
            <InputField
              value={apiKey}
              onChange={event => setApiKey(event.target.value)}
              placeholder={keyPlaceholder}
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
                    fromEmail,
                    token,
                    setError,
                    setApiKey,
                    setFromEmail,
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
  setFromEmail,
  dispatch
) => {
  const url = `${publicRuntimeConfig.backend}/admin/mail`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

  // Same param names as classic SBH; SBH3 maps key → resendApiKey.
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
    setFromEmail('');
    alert(`Could not save mail settings: ${message}`);
    return;
  }

  if (!response || response.status !== 200) {
    const message =
      typeof response?.data === 'string' ? response.data : 'Update failed';
    setError(message);
    setApiKey('');
    setFromEmail('');
    alert(`Could not save mail settings: ${message}`);
    return;
  }

  setError('');
  const successMessage =
    typeof response.data === 'string' ? response.data : 'Mail settings updated.';
  alert(successMessage);
  setApiKey('');
  setFromEmail('');
  mutate([`${publicRuntimeConfig.backend}/admin/mail`, token, dispatch]);
};
