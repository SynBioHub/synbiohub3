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
  const [requireLogin, setRequireLogin] = useState(false)
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

  const handleSave = async () => {
    const url = `${publicRuntimeConfig.backend}/admin/theme`;
    const headers = {
      Accept: 'text/plain',
      'X-authorization': token
    };

    // if (altHome !== '' && !isValidURI(altHome)) {
    //   alert('Alternate Home Page must be empty or contain a valid URL.');
    //   return; // Prevent form submission
    // }

    setLoading(true);
    const formData = new FormData();
    formData.append('instanceName', instanceName);
    formData.append('frontPageText', frontPageText);
    formData.append('altHome', altHome);
    formData.append('baseColor', baseColor);
    formData.append('removePublicEnabled', String(removePublicEnabled));
    formData.append('showModuleInteractions', String(showModuleInteractions));
    formData.append('requireLogin', String(requireLogin));
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
        <div className={styles.ExplorerContainer}>
          <div className={styles.title}>Theme</div>
          <div className={styles.themeFont}>Logo</div>
          <input
            type="file"
            onChange={(e) => setLogoFile(e.target.files[0])}
            className={styles.logheader}
          /> 

          <div className={styles.themeFont}>Instance Name</div>
          <input
            type="text"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            className={styles.tableinput}
          />

          <div className={styles.themeFont}>Front Page Description</div>
          <b>Preview:</b>
          <p className={styles.description} dangerouslySetInnerHTML={{__html: sdconverter.makeHtml(frontPageText.replace(/\\n/g, '\n'))}} />

          <p><b>Edit:</b></p>
          <textarea
            className={styles.wfull}
            value={frontPageText}
            onChange={(e) => setFrontPageText(e.target.value)}
          />
          <div className={styles.themeFont}>Alternate Home Page</div>
          <input
            type="text"
            value={altHome}
            onChange={(e) => setAltHome(e.target.value)}
            className={styles.tableinput}
          />

          <div className={styles.themeFont}>Color Settings</div>
          <p>
            <SketchPicker
              color={baseColor}
              onChange={color => setBaseColor(color.hex)}
              className={styles.colorpicker}
            />
          </p>

          <div className={styles.menucontainer}>
            <label className={styles.menuselector}>
              <input
                type="checkbox"
                checked={showModuleInteractions}
                onChange={handleShowModuleInteractionsChange}
                className={styles.themecheckbox}
              />
              <span className={styles.checktext}>Show Module Interactions</span>
            </label>
          </div>

          <div className={styles.menucontainer}>
            <label className={styles.menuselector}>
              <input
                type="checkbox"
                checked={removePublicEnabled}
                onChange={handleRemovePublicEnabledChange}
                className={styles.themecheckbox}
              />
              <span className={styles.checktext}>Remove Public Enabled</span>
            </label>
          </div>

          <div className={styles.menucontainer}>
            <label className={styles.menuselector}>
              <input
                type="checkbox"
                checked={requireLogin}
                onChange={handleRequireLoginChange}
                className={styles.themecheckbox}
              />
              <span className={styles.checktext}>Require Login</span>
            </label>
          </div>
          <div className={styles.actionbuttonslayout}>
            <button
              onClick={handleSave}
              className={styles.actionbutton}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}