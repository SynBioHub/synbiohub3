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
        <img
          alt="logo"
          className={styles.logo}
          src="/images/logo_uploaded.svg"
        />
      </Link>

      <div className={styles.navcontainer}>
        {loggedIn && (
          <nav className={styles.nav}>
            <Selector
              icon="/images/submit_white.svg"
              name="Submit"
              href="/submit"
            />

            <Selector
              icon="/images/shared.svg"
              name="Shared With Me"
              href="/shared"
            />

            <Selector
              icon="/images/submissions_white.svg"
              name="Submissions"
              href="/submissions"
            />
          </nav>
        )}

        <Link href="/search">
          <img
            alt="Search SynBioHub"
            className={styles.searchicon}
            src="/images/search.svg"
          />
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
