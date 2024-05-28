import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

import { addError, markPageVisited, restoreLogin } from '../redux/actions';
import styles from '../styles/layout.module.css';
import Footer from './Footer';
import Navbar from './Navbar/Navbar';
import DownloadStatus from './Reusable/Download/DownloadStatus';
import Errors from './Error/Errors';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import axios from 'axios';

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

  // Fetch registries once on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [registriesResponse, themeResponse] = await Promise.all([
          axios.get(`${publicRuntimeConfig.backend}/admin/registries`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }),
          axios.get(`${publicRuntimeConfig.backend}/admin/theme`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          })
        ]);

        console.log(registriesResponse.data);
        console.log(themeResponse.data);

        const registriesData = registriesResponse.data.registries || [];
        const themeData = themeResponse.data || [];

        setRegistries(registriesData);
        setTheme(themeData);

        localStorage.setItem('registries', JSON.stringify(registriesData));
        localStorage.setItem('theme', JSON.stringify(themeData));
      } catch (error) {
        console.error('Error fetching data', error);
        dispatch(addError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (!pageVisited && !properties.doNotTrack) dispatch(markPageVisited(true));
  }, [pageVisited, properties.doNotTrack]);

  console.log(localStorage);

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
  }, [loggedIn, router, protectRoute]);

  try {
    if (!protectRoute | loggedIn)
      return (
        <div>
          <Head>
            <title>SynBioHub</title>

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
