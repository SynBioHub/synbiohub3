import axios from 'axios';
import getConfig from 'next/config';
import useSWR from 'swr';

import styles from '../../styles/defaulttable.module.css';
import Loading from '../Reusable/Loading';
import { addError } from '../../redux/actions';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import Loader from 'react-loader-spinner';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
const { publicRuntimeConfig } = getConfig();

export default function Theme() {
  const dispatch = useDispatch();
  const { theme, loading } = useTheme(dispatch);
  console.log(theme);
  const [instanceName, setInstanceName] = useState('');   // default to empty
  const [frontPageText, setFrontPageText] = useState(''); // default to empty
  const [logoFile, setLogoFile] = useState(null);
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    if (theme) {
      setInstanceName(theme.instanceName);
      setFrontPageText(theme.frontPageText);
    }
  }, [theme]);

  const handleSave = async () => {
    const url = `${publicRuntimeConfig.backend}/admin/theme`;
  const headers = {
    Accept: 'text/plain',
    'X-authorization': token
  };

    const formData = new FormData();
    formData.append('instanceName', instanceName);
    formData.append('frontPageText', frontPageText);
    formData.append('baseColor', theme.themeParameters[0].value);
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    
    try {
      const response = await fetch(url, { method: 'POST', headers: headers, body: formData });
      const data = await response.text();
      console.log(url);
      console.log(headers);
      console.log(data);

      if (response.ok) {
        // Handle successful response if needed (e.g., show success notification)
      } else {
        // Handle non-2xx HTTP responses if needed (e.g., show error notification)
      }
    } catch (error) {
      console.log(error);
      // Handle unexpected errors (e.g., network issues)
    }
  };

  // If theme hasn't been set, display the loader
  if (!theme) {
    return (
      <div className="loader-container">
        <Loader
          type="Puff"
          color="#00BFFF"
          height={100}
          width={100}
          timeout={3000}
        />
      </div>
    );
  }


  if (loading) return <Loading />;
  return (
    <div>
      <div>Logo</div>
      <input type="file" onChange={(e) => setLogoFile(e.target.files[0])} />
      <div>Instance Name</div>
      <input
        type="text"
        value={instanceName}
        onChange={(e) => setInstanceName(e.target.value)}
      />
      <div>Front page description</div>
      <textarea
        value={frontPageText}
        onChange={(e) => setFrontPageText(e.target.value)}
      />

      <div>Color Settings</div>
      <table className={styles.table}>
        <tbody>
          <tr>
            <td>Base Color</td>
            <td>{theme.themeParameters[0].value}</td>
          </tr>
        </tbody>
      </table>
      <div>
        <input type="checkbox" checked={true} />
        Show module interactions
      </div>
      <div>
        <input type="checkbox" checked={true} />
        Remove public enabled
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}

export const useTheme = dispatch => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/theme`, dispatch],
    fetcher
  );
  return {
    theme: data,
    loading: !error && !data
  };
};

const fetcher = (url, dispatch) =>
  axios
    .get(url, {
      headers: {
        Accept: 'application/json'
      }
    })
    .then(response => response.data)
    .catch(error => {
      error.customMessage = 'Request failed for GET /admin/theme';
      error.fullUrl = url;
      dispatch(addError(error));
    });
