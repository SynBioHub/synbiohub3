import {
  faAlignLeft,
  faCloudUploadAlt,
  faSearch,
  faSignInAlt,
  faHome
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import styles from '../../styles/navbar.module.css';
import Profile from './Profile';
import Selector from './Selector';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

/**
 * This component renders the navigation bar at the top of sbh. Users use this to access
 * submissions, shared submissions, search, profile, admin page, and possibly more
 */
export default function Navbar() {
  const loggedIn = useSelector(state => state.user.loggedIn);
  const submitting = useSelector(state => state.submit.submitting);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const defaultLogo = '/images/logo.svg'

  const [profileControl, setProfileControl] = useState(
    <Selector icon={faSignInAlt} name="Log in or Register" href="/login" />
  );

  const [logoUrl, setLogoUrl] = useState(defaultLogo);

  useEffect(() => {
    if (loggedIn) {
      setProfileControl(<Profile />);
    } else {
      setProfileControl(
        <Selector icon={faSignInAlt} name="Sign In" href="/login" />
      );
    }
  }, [loggedIn]);

  let linkHref = "/";
  if (theme && theme.altHome && theme.altHome.length > 0) {
    linkHref = theme.altHome;
  }

  useEffect(() => {
    if (localStorage.getItem('logo')) {
      const urlLogo = `${publicRuntimeConfig.backend}/logo`;
      setLogoUrl(urlLogo);
    } else {
      setLogoUrl(defaultLogo);
    }
  }, [publicRuntimeConfig.backend]);

  return (
    <header
      className={styles.container}
      style={{ backgroundColor: theme?.themeParameters?.[0]?.value || '#465775' }}
    >
      <div className={styles.logoAndInstanceContainer}>
        <Link href={linkHref}>
          <a className={styles.logo}>
            <Image
              alt="logo"
              src={logoUrl}
              width={80}
              height={80}
              style={{ maxHeight: '50px', height: 'auto', width: '80px' }}
            />
          </a>
        </Link>


        {theme && (
          <Selector icon={faHome} name={theme.instanceName} href={linkHref} isInstanceName={true} />
        )}
      </div>

      <div className={styles.navcontainer}>
        {loggedIn && (
          <nav className={styles.nav}>
            <Selector
              icon={faCloudUploadAlt}
              customIcon={
                submitting ? (
                  <Loader
                    color="#F2E86D"
                    type="Puff"
                    height={25}
                    width={25}
                    className={styles.loader}
                  />
                ) : undefined
              }
              name="Submit"
              href="/submit"
            />
            <Selector
              icon={faAlignLeft}
              name="Submissions"
              href="/submissions"
            />
          </nav>
        )}

        <Link href="/search">
          <a>
            <FontAwesomeIcon
              icon={faSearch}
              size="2x"
              alt="Search SynBioHub"
              className={styles.searchicon}
            />
          </a>
        </Link>

        {profileControl}
      </div>
    </header>
  );
}
