import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { restoreLogin } from '../redux/actions';
import styles from '../styles/layout.module.css';
import Footer from './Footer';
import Navbar from './Navbar';

/**
 * This is a 'wrapper component' which dictates the general structure
 * of sbh. It should be used as a wrapper for all sbh pages, except in
 * rare and special circumstances.
 */
export default function TopLevel(properties) {
  const dispatch = useDispatch();
  const loggedIn = useSelector(state => state.user.loggedIn);
  const [navbar, setNavbar] = useState(<Navbar />);

  useEffect(() => {
    if (!loggedIn) {
      const username = localStorage.getItem('username');
      const token = localStorage.getItem('userToken');

      if (username && token) {
        dispatch(restoreLogin(username, token));
      }
    }
  }, [loggedIn, dispatch]);

  useEffect(() => {
    if (properties.navbar) setNavbar(properties.navbar);
  }, [properties.navbar]);

  return (
    <div>
      <Head>
        <title>SynBioHub</title>

        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className={styles.container}>
        {navbar}
        <div className={!properties.hideFooter ? styles.content : ''}>
          {properties.children}
        </div>
        {!properties.hideFooter && <Footer />}
      </div>
    </div>
  );
}
