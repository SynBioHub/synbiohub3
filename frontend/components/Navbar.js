import {
  faAlignLeft,
  faCloudUploadAlt,
  faSearch,
  faShareAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
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

  return (
    <header className={styles.container}>
      <Link href="/">
        <a className={styles.logo}>
          <Image
            alt="logo"
            width={80}
            height={80}
            src="/images/logo_uploaded.svg"
          />
        </a>
      </Link>

      <div className={styles.navcontainer}>
        {loggedIn && (
          <nav className={styles.nav}>
            <Selector icon={faCloudUploadAlt} name="Submit" href="/submit" />

            <Selector icon={faShareAlt} name="Shared With Me" href="/shared" />

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

        {loggedIn && <Profile />}
        {!loggedIn && (
          <Selector
            icon="/images/login.svg"
            name="Log in or Register"
            href="/login"
          />
        )}
      </div>
    </header>
  );
}
