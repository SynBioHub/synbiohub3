import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addError, markPageVisited, restoreLogin } from '../redux/actions';
import styles from '../styles/layout.module.css';
import Footer from './Footer';
import Navbar from './Navbar/Navbar';
import DownloadStatus from './Reusable/Download/DownloadStatus';
import Errors from './Error/Errors';
import axios from 'axios';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

/* eslint sonarjs/cognitive-complexity: "off" */

/**
 * This is a 'wrapper component' which dictates the general structure
 * of sbh. It should be used as a wrapper for all sbh pages, except in
 * rare and special circumstances.
 */
export default function TopLevel(properties) {
  const protectRoute = properties.publicPage ? false : true;
  const dispatch = useDispatch();
  const router = useRouter();
  const loggedIn = useSelector(state => state.user.loggedIn);
  const pageVisited = useSelector(state => state.tracking.pageVisited);
  const [registries, setRegistries] = useState([]);
  const [theme, setTheme] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let registriesData = JSON.parse(localStorage.getItem('registries'));
        let themeData = JSON.parse(localStorage.getItem('theme'));

        // Check if registriesData is empty/null/undefined or empty array
        const needsRegistries = !registriesData || 
          (Array.isArray(registriesData) && registriesData.length === 0) ||
          (typeof registriesData === 'object' && Object.keys(registriesData).length === 0);
        
        // Check if themeData is empty/null/undefined or empty array
        const needsTheme = !themeData || 
          (Array.isArray(themeData) && themeData.length === 0) ||
          (typeof themeData === 'object' && Object.keys(themeData).length === 0);

        // Fetch only what's needed
        const fetchPromises = [];
        
        if (needsRegistries) {
          fetchPromises.push(
            axios.get(`${publicRuntimeConfig.backend}/admin/registries`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            }).then(response => {
              console.log('Registries response:', response.data); // Debug line
              // Handle both cases: direct array or object with registries property
              registriesData = Array.isArray(response.data) 
                ? response.data 
                : (response.data.registries || response.data || []);
              console.log('Parsed registriesData:', registriesData); // Debug line
              localStorage.setItem('registries', JSON.stringify(registriesData));
              return { type: 'registries', data: registriesData };
            }).catch(error => {
              console.error('Error fetching registries', error);
              dispatch(addError(error));
              return { type: 'registries', data: null };
            })
          );
        }
        
        if (needsTheme) {
          fetchPromises.push(
            axios.get(`${publicRuntimeConfig.backend}/admin/theme`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            }).then(response => {
              themeData = response.data || [];
              localStorage.setItem('theme', JSON.stringify(themeData));
              return { type: 'theme', data: themeData };
            }).catch(error => {
              console.error('Error fetching theme', error);
              dispatch(addError(error));
              return { type: 'theme', data: null };
            })
          );
        }

        // Wait for all fetches to complete
        if (fetchPromises.length > 0) {
          await Promise.all(fetchPromises);
        }

        // Set state with whatever we have (from localStorage or fresh fetch)
        if (registriesData) {
          setRegistries(registriesData);
        }
        if (themeData) {
          setTheme(themeData);
        }
      } catch (error) {
        console.error('Error fetching data', error);
        dispatch(addError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Periodically check and update registries if they've changed on the backend
  useEffect(() => {
    const checkAndUpdateRegistries = async () => {
      try {
        const response = await axios.get(`${publicRuntimeConfig.backend}/admin/registries`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        // Parse the response
        const backendRegistries = Array.isArray(response.data) 
          ? response.data 
          : (response.data.registries || response.data || []);

        // Get current registries from localStorage
        const currentRegistries = JSON.parse(localStorage.getItem('registries')) || [];

        // Compare the two arrays (deep comparison)
        const registriesChanged = JSON.stringify(backendRegistries) !== JSON.stringify(currentRegistries);

        if (registriesChanged) {
          console.log('Registries have changed, updating localStorage and state');
          localStorage.setItem('registries', JSON.stringify(backendRegistries));
          setRegistries(backendRegistries);
        }
      } catch (error) {
        console.error('Error checking registries for updates', error);
        // Don't dispatch error for periodic checks to avoid spam
      }
    };

    // Check immediately, then every 5 minutes (300000 ms)
    const interval = setInterval(checkAndUpdateRegistries, 5 * 60 * 1000);
    
    // Also check once after a short delay to avoid immediate duplicate requests
    const initialTimeout = setTimeout(checkAndUpdateRegistries, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!pageVisited && !properties.doNotTrack) dispatch(markPageVisited(true));
  }, [pageVisited, properties.doNotTrack, dispatch]);

  useEffect(() => {
    if (!loggedIn) {
      const username = localStorage.getItem('username');
      const token = localStorage.getItem('userToken');

      if (username && token) {
        dispatch(restoreLogin(username, token));
      } else if (protectRoute) {
        router.replace(`/login?next=${router.asPath}`);
      }
    }
  }, [loggedIn, router, protectRoute, dispatch]);

  try {
    if (!protectRoute || loggedIn)
      return (
        <div>
          <Head>
            <title>{theme.instanceName} | SynBioHub</title>
            <link href="/favicon.ico" rel="icon" />
          </Head>
          <Errors />
          <div className={styles.container}>
            <div className={!properties.hideFooter ? styles.content : ''}>
              {properties.navbar ? properties.navbar : <Navbar />}
              {properties.children}
            </div>
            {!properties.hideFooter && <Footer />}
          </div>
          <DownloadStatus />
        </div>
      );
    return null;
  } catch (error) {
    error.customMessage = 'Error caught by general catch block';
    dispatch(addError(error));
  }
}
