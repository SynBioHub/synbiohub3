import axios from 'axios';
import getConfig from 'next/config';
import styles from '../../styles/admin.module.css';
import Loading from '../Reusable/Loading';
import { SketchPicker } from 'react-color';
import { addError } from '../../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { isValidURI } from '../Viewing/Shell';
const { publicRuntimeConfig } = getConfig();

import showdown from "showdown"
const sdconverter = new showdown.Converter()

export default function Theme() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState({});
  const [instanceName, setInstanceName] = useState('');
  const [frontPageText, setFrontPageText] = useState('');
  const [altHome, setAltHome] = useState('');
  const [baseColor, setBaseColor] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [showModuleInteractions, setShowModuleInteractions] = useState(true);
  const [removePublicEnabled, setRemovePublicEnabled] = useState(true);
  const [requireLogin, setRequireLogin] = useState(false);
  const [suppressDebugLogs, setSuppressDebugLogs] = useState(false);
  const [suppressInfoLogs, setSuppressInfoLogs] = useState(false);
  const [suppressWarningLogs, setSuppressWarningLogs] = useState(false);
  const [suppressErrorLogs, setSuppressErrorLogs] = useState(false);
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    fetchThemeData();
  }, []);

  const fetchThemeData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${publicRuntimeConfig.backend}/admin/theme`, {
        headers: {
          Accept: 'application/json',
          'X-authorization': token
        }
      });
      const themeData = response.data;
      updateThemeState(themeData);
      localStorage.setItem('theme', JSON.stringify(themeData));
    } catch (error) {
      console.error('Error fetching theme:', error);
      const cachedTheme = JSON.parse(localStorage.getItem('theme')) || {};
      updateThemeState(cachedTheme);
    } finally {
      setLoading(false);
    }
  };

  const updateThemeState = (themeData) => {
    setTheme(themeData);
    setInstanceName(themeData.instanceName || '');
    setFrontPageText(themeData.frontPageText || '');
    setAltHome(themeData.altHome || '');
    setBaseColor(themeData.themeParameters?.[0]?.value || '');
    setShowModuleInteractions(themeData.showModuleInteractions === 'true' || themeData.showModuleInteractions === true);
    setRemovePublicEnabled(themeData.removePublicEnabled === 'true' || themeData.removePublicEnabled === true);
    setRequireLogin(themeData.requireLogin === 'true' || themeData.requireLogin === true);
    setSuppressDebugLogs(themeData.suppressDebugLogs === 'true' || themeData.suppressDebugLogs === true);
    setSuppressInfoLogs(themeData.suppressInfoLogs === 'true' || themeData.suppressInfoLogs === true);
    setSuppressWarningLogs(themeData.suppressWarningLogs === 'true' || themeData.suppressWarningLogs === true);
    setSuppressErrorLogs(themeData.suppressErrorLogs === 'true' || themeData.suppressErrorLogs === true);
  };

  const handleShowModuleInteractionsChange = (event) => {
    setShowModuleInteractions(event.target.checked);
  };

  const handleRemovePublicEnabledChange = (event) => {
    setRemovePublicEnabled(event.target.checked);
  };

  const handleRequireLoginChange = (event) => {
    setRequireLogin(event.target.checked);
  }

  const handleBaseColorChange = (event) => {
    setBaseColor(event.target.value);
  };

  const handleSuppressDebugLogsChange = (event) => {
    setSuppressDebugLogs(event.target.checked);
  };

  const handleSuppressInfoLogsChange = (event) => {
    setSuppressInfoLogs(event.target.checked);
  };

  const handleSuppressWarningLogsChange = (event) => {
    setSuppressWarningLogs(event.target.checked);
  };

  const handleSuppressErrorLogsChange = (event) => {
    setSuppressErrorLogs(event.target.checked);
  };

  const handleSave = async () => {

    setLoading(true);
    const formData = new FormData();
    formData.append('instanceName', instanceName);
    formData.append('frontPageText', frontPageText);
    formData.append('altHome', altHome);
    formData.append('baseColor', baseColor);
    formData.append('removePublicEnabled', String(removePublicEnabled));
    formData.append('showModuleInteractions', String(showModuleInteractions));
    formData.append('requireLogin', String(requireLogin));
    formData.append('suppressDebugLogs', String(suppressDebugLogs));
    formData.append('suppressInfoLogs', String(suppressInfoLogs));
    formData.append('suppressWarningLogs', String(suppressWarningLogs));
    formData.append('suppressErrorLogs', String(suppressErrorLogs));
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const response = await fetch(`${publicRuntimeConfig.backend}/admin/theme`, {
        method: 'POST',
        headers: {
          Accept: 'text/plain',
          'X-authorization': token
        },
        body: formData
      });

      if (response.ok) {
        // Create updated theme object
        const updatedTheme = {
          ...theme,
          instanceName,
          frontPageText,
          altHome,
          themeParameters: [{ value: baseColor }],
          showModuleInteractions,
          removePublicEnabled,
          requireLogin
        };

        // Update localStorage
        localStorage.setItem('theme', JSON.stringify(updatedTheme));

        // Update component state
        updateThemeState(updatedTheme);

        alert('Theme saved successfully!');
        window.location.reload();
      } else {
        throw new Error('Failed to save theme');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Error saving theme');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className={styles.container}>
      {theme && (
        <div className={styles.themeContainer}>
          <div className={styles.title}>Theme</div>
          {/* <div className={styles.themeFont}>Logo</div>
          <input
            className={styles.newLogoFilePicker}
            type="file"
            onChange={(e) => setLogoFile(e.target.files[0])}
          />  */}

          <h2 className={styles.themeFont}>Instance Name</h2>
          <input
            type="text"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            className={styles.tableinput}
          />

          <h2 className={styles.themeFont}>Front Page Description</h2>
          <h3><b>Preview:</b></h3>
          <p className={styles.description} dangerouslySetInnerHTML={{ __html: sdconverter.makeHtml(frontPageText.replace(/\\n/g, '\n')) }} />

          <h3><b>Edit:</b></h3>
          <textarea
            className={styles.wfull}
            value={frontPageText}
            onChange={(e) => setFrontPageText(e.target.value)}
            rows={5}
          />
          <h2 className={styles.themeFont}>Alternate Home Page</h2>
          <input
            type="text"
            value={altHome}
            onChange={(e) => setAltHome(e.target.value)}
            className={styles.tableinput}
          />

          <div className={styles.bottomSettings}>
            <div>
              <h2 className={styles.themeFont}>Color Settings</h2>
              <SketchPicker
                color={baseColor}
                onChange={color => setBaseColor(color.hex)}
                className={styles.colorpicker}
                width='20vw'
              />
            </div>

            <div>
              <h2 className={`${styles.themeFont} ${styles.centeredTitle}`}>Msc Theme Settings</h2>
              <div className={styles.themeChecksFlex}>

                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={showModuleInteractions}
                    onChange={handleShowModuleInteractionsChange}
                    className={styles.themecheckbox}
                  />
                  Show Module Interactions
                </label>

                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={removePublicEnabled}
                    onChange={handleRemovePublicEnabledChange}
                    className={styles.themecheckbox}
                  />
                  Remove Public Enabled
                </label>

                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={requireLogin}
                    onChange={handleRequireLoginChange}
                    className={styles.themecheckbox}
                  />
                  Require Login
                </label>
                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={suppressDebugLogs}
                    onChange={handleSuppressDebugLogsChange}
                    className={styles.themecheckbox}
                  />
                  Suppress Debug Logs
                </label>
                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={suppressInfoLogs}
                    onChange={handleSuppressInfoLogsChange}
                    className={styles.themecheckbox}
                  />
                  Suppress Info Logs
                </label>
                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={suppressWarningLogs}
                    onChange={handleSuppressWarningLogsChange}
                    className={styles.themecheckbox}
                  />
                  Suppress Warning Logs
                </label>
                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={suppressErrorLogs}
                    onChange={handleSuppressErrorLogsChange}
                    className={styles.themecheckbox}
                  />
                  Suppress Error Logs
                </label>

              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            className={styles.actionbutton}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}