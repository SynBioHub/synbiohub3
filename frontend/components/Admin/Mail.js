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
      setActualApiKey(email.sendGridApiKey);
      setActualSendGridEmail(email.sendGridFromEmail);
    }
  }, [email]);

  useEffect(() => {
    setApiKey(actualApiKey);
    setSendGridEmail(actualSendGridEmail);
  }, [actualApiKey, actualSendGridEmail]);

  useEffect(() => {
    setUnsavedApiKey(apiKey !== actualApiKey);
    setUnsavedSendGridEmail(sendGridEmail !== actualSendGridEmail);
  }, [apiKey, actualApiKey, sendGridEmail, actualSendGridEmail]);

  if (loading) {
    return <Loading />;
  } else if (email) {
    return (
      <div className={styles.mailcontainer}>
        <h2 className={styles.mailheader}>SendGrid Configuration</h2>
        {error && <ErrorMessage message={error} />}
        <p>API Key</p>
        <InputField
          value={apiKey}
          onChange={event => setApiKey(event.target.value)}
          placeholder="Key"
          type="text"
          onKeyPress={() => {}}
          highlight={unsavedApiKey}
          icon={faKey}
        />
        <p>Email Address</p>
        <InputField
          value={sendGridEmail}
          onChange={event => setSendGridEmail(event.target.value)}
          placeholder="Email"
          type="text"
          onKeyPress={() => {}}
          highlight={unsavedSendGridEmail}
          icon={faEnvelope}
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
                actualApiKey,
                actualSendGridEmail,
                dispatch
              )
            }
          />
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
    .then(response => response.data)
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
  actualApiKey,
  actualSendGridEmail,
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
  }

  if (response.status !== 200) {
    const message = await response.text();
    setError(message);
    setApiKey(actualApiKey);
    setSendGridEmail(actualSendGridEmail);
  } else {
    setError('');
    mutate([`${publicRuntimeConfig.backend}/admin/mail`, token, dispatch]);
  }
};
