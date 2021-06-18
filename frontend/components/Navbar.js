import {
  faAlignLeft,
  faCloudUploadAlt,
  faSearch,
  faShareAlt,
  faSignInAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../styles/navbar.module.css';
import Profile from './NavbarComponents/Profile';
import Selector from './NavbarComponents/Selector';

/**
 * This component renders the navigation bar at the top of sbh. Users use this to access
 * submissions, shared submissions, search, profile, admin page, and possibly more
 */
export default function Navbar() {
  const loggedIn = useSelector(state => state.user.loggedIn);
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
      <Link href="/">
        <a className={styles.logo}>
          <Image alt="logo" width={80} height={80} src="/images/logo.svg" />
        </a>
      </Link>

      <div className={styles.navcontainer}>
        {loggedIn && (
          <nav className={styles.nav}>
            <Selector icon={faCloudUploadAlt} name="Submit" href="/submit" />
            <Selector
              icon={faAlignLeft}
              name="Submissions"
              href="/submissions"
            />
            x
            <Selector icon={faShareAlt} name="Shared With Me" href="/shared" />
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
