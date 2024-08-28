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
import backendUrl from './GetUrl/GetBackend';
import getConfig from 'next/config';
import axios from 'axios';

// const { publicRuntimeConfig } = getConfig();

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

        if (!registriesData || !themeData) {
          const [registriesResponse, themeResponse] = await Promise.all([
            axios.get(`${backendUrl}/admin/registries`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            }),
            axios.get(`${backendUrl}/admin/theme`, {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            })
          ]);

          registriesData = registriesResponse.data.registries || [];
          themeData = themeResponse.data || [];

          localStorage.setItem('registries', JSON.stringify(registriesData));
          localStorage.setItem('theme', JSON.stringify(themeData));
        }

        setRegistries(registriesData);
        setTheme(themeData);
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
