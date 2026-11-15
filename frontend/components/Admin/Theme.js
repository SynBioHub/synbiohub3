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

import {
  getFrontPageMarkdown,
  setFrontPageMarkdown,
  toFrontPageHtml
} from '../../lib/frontPageText';

/** Client-side logo size cap (1 MB). */
const MAX_LOGO_BYTES = 1048576

export default function Theme() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState({});
  const [instanceName, setInstanceName] = useState('');
  const [frontPageText, setFrontPageText] = useState('');
  const [altHome, setAltHome] = useState('');
  const [baseColor, setBaseColor] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoFileError, setLogoFileError] = useState('');
  const [showModuleInteractions, setShowModuleInteractions] = useState(true);
  const [removePublicEnabled, setRemovePublicEnabled] = useState(true);
  const [requireLogin, setRequireLogin] = useState(false);
  const [allowPublicSignup, setAllowPublicSignup] = useState(true);
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
    const parsedThemeParameters = Array.isArray(themeData.themeParameters)
      ? themeData.themeParameters
      : (themeData.themeParameters && typeof themeData.themeParameters === 'object')
        ? [{ value: themeData.themeParameters.default || '' }]
        : [];

    setTheme(themeData);
    setInstanceName(themeData.instanceName || '');
    const savedMarkdown = getFrontPageMarkdown();
    setFrontPageText(
      savedMarkdown !== null && savedMarkdown !== undefined
        ? savedMarkdown
        : themeData.frontPageText || ''
    );
    setAltHome(themeData.altHome || '');
    setBaseColor(parsedThemeParameters?.[0]?.value || '');
    setShowModuleInteractions(themeData.showModuleInteractions === 'true' || themeData.showModuleInteractions === true);
    setRemovePublicEnabled(themeData.removePublicEnabled === 'true' || themeData.removePublicEnabled === true);
    setRequireLogin(themeData.requireLogin === 'true' || themeData.requireLogin === true);
    setAllowPublicSignup(themeData.allowPublicSignup === 'true' || themeData.allowPublicSignup === true);
    setSuppressDebugLogs(themeData.suppressDebugLogs === 'true' || themeData.suppressDebugLogs === true);
    setSuppressInfoLogs(themeData.suppressInfoLogs === 'true' || themeData.suppressInfoLogs === true);
    setSuppressWarningLogs(themeData.suppressWarningLogs === 'true' || themeData.suppressWarningLogs === true);
    setSuppressErrorLogs(themeData.suppressErrorLogs === 'true' || themeData.suppressErrorLogs === true);
    setLogoFile(themeData.logo || null);
  };

  const handleLogoFileChange = event => {
    const file = event.target.files?.[0];
    if (!file) {
      setLogoFile(null);
      setLogoFileError('');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoFile(null);
      setLogoFileError(
        `This file is too large (${Math.ceil(file.size / 1024)} KB). Logos must be ${MAX_LOGO_BYTES / 1024} KB or smaller.`
      );
      event.target.value = '';
      return;
    }
    setLogoFile(file);
    setLogoFileError('');
  };

  const buildThemeFormData = (logoOverride) => {
    const frontPageTextHtml = toFrontPageHtml(frontPageText);
    // Both SBH1 and SBH3 accept optional multipart `logo` on POST /admin/theme.
    const themeData = new FormData();
    themeData.append('instanceName', instanceName);
    themeData.append('frontPageText', frontPageTextHtml);
    themeData.append('altHome', altHome);
    themeData.append('baseColor', baseColor);
    themeData.append('themeParameters', JSON.stringify([{ value: baseColor }]));
    themeData.append('removePublicEnabled', String(removePublicEnabled));
    themeData.append('showModuleInteractions', String(showModuleInteractions));
    themeData.append('requireLogin', String(requireLogin));
    themeData.append('suppressDebugLogs', String(suppressDebugLogs));
    themeData.append('suppressInfoLogs', String(suppressInfoLogs));
    themeData.append('suppressWarningLogs', String(suppressWarningLogs));
    themeData.append('suppressErrorLogs', String(suppressErrorLogs));

    const logoToUpload =
      logoOverride instanceof File
        ? logoOverride
        : logoFile instanceof File
          ? logoFile
          : null;
    if (logoToUpload) {
      themeData.append('logo', logoToUpload);
    }

    return { themeData, frontPageTextHtml };
  };

  const persistThemeSuccess = (frontPageTextHtml, successMessage) => {
    setFrontPageMarkdown(frontPageText);
    const updatedTheme = {
      ...theme,
      instanceName,
      frontPageText: frontPageTextHtml,
      altHome,
      themeParameters: [{ value: baseColor }],
      showModuleInteractions,
      removePublicEnabled,
      requireLogin
    };
    delete updatedTheme.logoUrl;

    try {
      localStorage.removeItem('sbh_logo');
      localStorage.setItem('theme', JSON.stringify(updatedTheme));
    } catch (e) {
      // ignore storage errors
    }

    updateThemeState(updatedTheme);
    alert(successMessage);
    window.location.reload();
  };

  const handleSave = async () => {
    if (logoFile instanceof File && logoFile.size > MAX_LOGO_BYTES) {
      alert(
        `The logo file is too large. Maximum size is ${MAX_LOGO_BYTES / 1024} KB (1 MB). Choose a smaller image or compress it.`
      );
      return;
    }

    setLoading(true);
    const { themeData, frontPageTextHtml } = buildThemeFormData();

    try {
      const response = await fetch(`${publicRuntimeConfig.backend}/admin/theme`, {
        method: 'POST',
        headers: {
          Accept: 'text/plain',
          'X-authorization': token
        },
        body: themeData
      });

      if (response.ok) {
        persistThemeSuccess(frontPageTextHtml, 'Theme saved successfully!');
      } else {
        const errText = await response.text().catch(() => '');
        const isTooLarge =
          response.status === 413 ||
          /FileSizeLimitExceededException|maximum permitted size|1048576/i.test(errText);
        if (isTooLarge) {
          alert(
            `The logo file is too large for the server (maximum ${MAX_LOGO_BYTES / 1024} KB). Choose a smaller image or compress it.`
          );
        } else {
          throw new Error(errText || 'Failed to save theme');
        }
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      alert(error.message || 'Error saving theme');
    } finally {
      setLoading(false);
    }
  };

  const handleResetLogo = async () => {
    if (
      !window.confirm(
        'Reset the instance logo to the default SynBioHub logo? This will save immediately.'
      )
    ) {
      return;
    }

    setLoading(true);
    setLogoFileError('');

    try {
      const defaultLogoResponse = await fetch('/images/logo.svg', { cache: 'no-store' });
      if (!defaultLogoResponse.ok) {
        throw new Error('Could not load the default logo.');
      }

      const blob = await defaultLogoResponse.blob();
      const defaultLogoFile = new File([blob], 'logo.svg', {
        type: blob.type || 'image/svg+xml'
      });

      const { themeData, frontPageTextHtml } = buildThemeFormData(defaultLogoFile);
      const response = await fetch(`${publicRuntimeConfig.backend}/admin/theme`, {
        method: 'POST',
        headers: {
          Accept: 'text/plain',
          'X-authorization': token
        },
        body: themeData
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || 'Failed to reset logo');
      }

      setLogoFile(null);
      persistThemeSuccess(frontPageTextHtml, 'Logo reset to default.');
    } catch (error) {
      console.error('Error resetting logo:', error);
      alert(error.message || 'Error resetting logo');
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className={styles.container}>
      {theme && (
        <div className={styles.themeContainer}>
          <div className={styles.title}>Theme</div>
          <div className={styles.themeFont}>Logo</div>
          <p className={styles.logoHint}>
            Image files only. Maximum size: {MAX_LOGO_BYTES / 1024} KB (1 MB).
          </p>
          {logoFileError ? (
            <p className={styles.logoFileError} role="alert">
              {logoFileError}
            </p>
          ) : null}
          <div className={styles.logoActions}>
            <input
              className={styles.newLogoFilePicker}
              type="file"
              onChange={handleLogoFileChange}
              accept="image/*"
            />
            <button
              type="button"
              onClick={handleResetLogo}
              className={styles.resetLogoButton}
            >
              Reset to Default Logo
            </button>
          </div>
          <h2 className={styles.themeFont}>Instance Name</h2>
          <input
            type="text"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            className={styles.tableinput}
          />

          <h2 className={styles.themeFont}>Front Page Description</h2>
          <h3><b>Preview:</b></h3>
          <p
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: toFrontPageHtml(frontPageText) }}
          />

          <h3><b>Edit (Markdown):</b></h3>
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
                    onChange={event => setShowModuleInteractions(event.target.checked)}
                    className={styles.themecheckbox}
                  />
                  Show Module Interactions
                </label>

                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={removePublicEnabled}
                    onChange={event => setRemovePublicEnabled(event.target.checked)}
                    className={styles.themecheckbox}
                  />
                  Remove Public Enabled
                </label>

                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={requireLogin}
                    onChange={event => setRequireLogin(event.target.checked)}
                    className={styles.themecheckbox}
                  />
                  Require Login
                </label>
                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={suppressDebugLogs}
                    onChange={event => setSuppressDebugLogs(event.target.checked)}
                    className={styles.themecheckbox}
                  />
                  Suppress Debug Logs
                </label>
                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={suppressInfoLogs}
                    onChange={event => setSuppressInfoLogs(event.target.checked)}
                    className={styles.themecheckbox}
                  />
                  Suppress Info Logs
                </label>
                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={suppressWarningLogs}
                    onChange={event => setSuppressWarningLogs(event.target.checked)}
                    className={styles.themecheckbox}
                  />
                  Suppress Warning Logs
                </label>
                <label className={styles.themecheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={suppressErrorLogs}
                    onChange={event => setSuppressErrorLogs(event.target.checked)}
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