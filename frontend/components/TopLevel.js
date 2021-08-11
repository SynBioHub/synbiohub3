import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
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
  const protectRoute = properties.publicPage ? false : true;
  const dispatch = useDispatch();
  const router = useRouter();
  const loggedIn = useSelector(state => state.user.loggedIn);

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

  if (!protectRoute | loggedIn)
    return (
      <div>
        <Head>
          <title>SynBioHub</title>

          <link href="/favicon.ico" rel="icon" />
        </Head>

        <div className={styles.container}>
          <div className={!properties.hideFooter ? styles.content : ''}>
            {properties.navbar ? properties.navbar : <Navbar />}
            {properties.children}
          </div>
          {!properties.hideFooter && <Footer />}
        </div>
      </div>
    );
  return null;
}
