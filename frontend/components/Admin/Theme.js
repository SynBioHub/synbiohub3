import axios from 'axios';
import getConfig from 'next/config';
import styles from '../../styles/defaulttable.module.css';
import Loading from '../Reusable/Loading';
import { addError } from '../../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { isValidURI } from '../Viewing/Shell';
const { publicRuntimeConfig } = getConfig();

export default function Theme() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState({});
  const [instanceName, setInstanceName] = useState('');
  const [frontPageText, setFrontPageText] = useState('');
  const [altHome, setAltHome] = useState('');
  const [baseColor, setBaseColor] = useState('');
  // const [logoFile, setLogoFile] = useState(null);
  const [showModuleInteractions, setShowModuleInteractions] = useState(true);
  const [removePublicEnabled, setRemovePublicEnabled] = useState(true);
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
    setShowModuleInteractions(themeData.showModuleInteractions ?? true);
    setRemovePublicEnabled(themeData.removePublicEnabled ?? true);
  };

  const handleShowModuleInteractionsChange = (event) => {
    setShowModuleInteractions(event.target.checked);
  };

  const handleRemovePublicEnabledChange = (event) => {
    setRemovePublicEnabled(event.target.checked);
  };

  const handleBaseColorChange = (event) => {
    setBaseColor(event.target.value);
  };

  const handleSave = async () => {
    window.location.reload();
    if (altHome !== '' && !isValidURI(altHome)) {
      alert('Alternate Home Page must be empty or contain a valid URL.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('instanceName', instanceName);
    formData.append('frontPageText', frontPageText);
    formData.append('altHome', altHome);
    formData.append('baseColor', baseColor);
    formData.append('removePublicEnabled', removePublicEnabled);
    formData.append('showModuleInteractions', showModuleInteractions);
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
          removePublicEnabled
        };

        // Update localStorage
        localStorage.setItem('theme', JSON.stringify(updatedTheme));
        
        // Update component state
        updateThemeState(updatedTheme);
        
        alert('Theme saved successfully!');
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
    <div className="p-4">
      <div className="mb-4">
        <div className="font-medium mb-2">Logo</div>
        <input 
          type="file" 
          onChange={(e) => setLogoFile(e.target.files[0])}
          className="mb-4" 
        />

        <div className="font-medium mb-2">Instance Name</div>
        <input
          type="text"
          value={instanceName}
          onChange={(e) => setInstanceName(e.target.value)}
          className="w-full max-w-md p-2 border rounded"
        />

        <div className="font-medium mb-2 mt-4">Front Page Description</div>
        <textarea
          value={frontPageText}
          onChange={(e) => setFrontPageText(e.target.value)}
          rows={10}
          cols={100}
        />

        <div className="font-medium mb-2 mt-4">Alternate Home Page</div>
        <input
          type="text"
          value={altHome}
          onChange={(e) => setAltHome(e.target.value)}
          className="w-full max-w-2xl p-2 border rounded"
        />

        <div className="font-medium mb-2 mt-4">Color Settings</div>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td>Base Color</td>
              <td>
                <input
                  type="text"
                  value={baseColor}
                  onChange={handleBaseColorChange}
                  className="p-2 border rounded"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showModuleInteractions}
              onChange={handleShowModuleInteractionsChange}
              className="form-checkbox"
            />
            <span>Show Module Interactions</span>
          </label>
        </div>

        <div className="mt-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={removePublicEnabled}
              onChange={handleRemovePublicEnabledChange}
              className="form-checkbox"
            />
            <span>Remove Public Enabled</span>
          </label>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}