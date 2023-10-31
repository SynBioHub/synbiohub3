import {
  faAlignLeft,
  faCloudUploadAlt,
  faSearch,
  faSignInAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import { useTheme } from '../Admin/Theme';

import styles from '../../styles/navbar.module.css';
import Profile from './Profile';
import Selector from './Selector';

/**
 * This component renders the navigation bar at the top of sbh. Users use this to access
 * submissions, shared submissions, search, profile, admin page, and possibly more
 */
export default function Navbar() {
  const loggedIn = useSelector(state => state.user.loggedIn);
  const submitting = useSelector(state => state.submit.submitting);
  const { theme, loading } = useTheme();

  const [profileControl, setProfileControl] = useState(
    <Selector icon={faSignInAlt} name="Log in or Register" href="/login" />
  );

  useEffect(() => {
    if (loggedIn) setProfileControl(<Profile />);
    else
      setProfileControl(
        <Selector icon={faSignInAlt} name="Sign In" href="/login" />
      );
  }, [loggedIn]);

  return (
    <header className={styles.container}>

      <div className={styles.logoAndInstanceContainer}> {/* This is your new div container */}
        <Link href="/">
          <a className={styles.logo}>
            {/* <Image alt="logo" width={80} height={80} src="/images/logo.svg" /> */}
            <Image alt="logo" width={80} height={80} src="/images/widevibe.gif" />
          </a>
        </Link>

        {!loading && theme && (
          <Selector name={theme.instanceName} href="/" isInstanceName={true} />
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
