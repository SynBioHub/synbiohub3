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
import { isValidURI } from '../Viewing/Shell';
const { publicRuntimeConfig } = getConfig();

export default function Theme() {
  const dispatch = useDispatch();
  const { theme, loading } = useTheme(dispatch);
  const [instanceName, setInstanceName] = useState('');   // default to empty
  const [frontPageText, setFrontPageText] = useState(''); // default to empty
  const [altHome, setAltHome] = useState('');
  const [baseColor, setBaseColor] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [showModuleInteractions, setShowModuleInteractions] = useState(true);
  const [removePublicEnabled, setRemovePublicEnabled] = useState(true);
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    if (theme) {
      setInstanceName(theme.instanceName);
      setFrontPageText(theme.frontPageText);
      setAltHome(theme.altHome);
    }
  }, [theme]);

  useEffect(() => {
    if (theme && theme.themeParameters && theme.themeParameters[0]) {
      setBaseColor(theme.themeParameters[0].value);
    }
  }, [theme]);

  const handleShowModuleInteractionsChange = (event) => {
    setShowModuleInteractions(event.target.checked);
  };

  const handleRemovePublicEnabledChange = (event) => {
    setRemovePublicEnabled(event.target.checked);
  };

  const handleBaseColorChange = (event) => {
    setBaseColor(event.target.value);
    // Optionally, update themeParameters directly if needed
    // theme.themeParameters[0].value = event.target.value;
  };

  const handleSave = async () => {
    const url = `${publicRuntimeConfig.backend}/admin/theme`;
    const headers = {
      Accept: 'text/plain',
      'X-authorization': token
    };

    if (altHome !== '' && !isValidURI(altHome)) {
      alert('Alternate Home Page must be empty or contain a valid URL.');
      return; // Prevent form submission
    }

    const formData = new FormData();
    formData.append('instanceName', instanceName);
    formData.append('frontPageText', frontPageText);
    formData.append('altHome', altHome);
    formData.append('baseColor', baseColor);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const response = await fetch(url, { method: 'POST', headers: headers, body: formData });
      const data = await response.text();

      if (response.ok) {
        window.location.reload();
      } else {
        alert("Error saving theme");
      }
    } catch (error) {
      alert("Error saving theme");
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
        style={{ width: '400px' }}
      />
      <div>Front Page Description</div>
      <textarea
        value={frontPageText}
        onChange={(e) => setFrontPageText(e.target.value)}
        rows={10}  // Number of rows
        cols={100}  // Number of columns
      />
      <div>Alternate Home Page</div>
      <input
        type="text"
        value={altHome}
        onChange={(e) => setAltHome(e.target.value)}
        style={{ width: '600px' }}
      />

      <div>Color Settings</div>
      <table className={styles.table}>
        <tbody>
          <tr>
            <td>Base Color</td>
            <td>
              <input
                type="text"
                value={baseColor}
                onChange={handleBaseColorChange}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div>
        <input
          type="checkbox"
          checked={showModuleInteractions}
          onChange={handleShowModuleInteractionsChange}
        />
        Show Module Interactions
      </div>
      <div>
        <input
          type="checkbox"
          checked={removePublicEnabled}
          onChange={handleRemovePublicEnabledChange}
        />
        Remove Public Enabled
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}

export const useTheme = () => {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(JSON.parse(storedTheme));
    }
    setLoading(false);
  }, []);

  return { theme, loading };
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
      if (error.message === 'Network Error') {
        // Change the error message or handle it differently
        console.error('Unable to connect to the server. Please check your network connection.');
        dispatch(addError(error));
      } else {
        // Handle other errors      
        error.customMessage = 'Request failed for GET /admin/theme31278931739137131';
        error.fullUrl = url;
        dispatch(addError(error));
      }

    });
