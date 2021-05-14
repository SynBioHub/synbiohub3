import Link from 'next/link';

import { useDispatch, useSelector } from 'react-redux';
import Selector from './NavbarComponents/Selector';
import SearchBar from './NavbarComponents/SearchBar';
import { setSearchingActive } from '../redux/actions';

import styles from '../styles/navbar.module.css';

/**
 * This component renders the navigation bar at the top of sbh. Users use this to access
 * submissions, shared submissions, search, profile, admin page, and possibly more
 */
export default function Navbar() {
  const searchingOpen = useSelector((state) => state.search.active);
  const dispatch = useDispatch();
  const loggedIn = useSelector((state) => state.user.loggedIn);

  if (!searchingOpen) {
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
              href='/shared'
            />

            <Selector
              icon="/images/submissions_white.svg"
              name="Submissions"
              href="/submissions"
            />
          </nav>
          )}

          <img
            className={styles.searchicon}
            onClick={() => dispatch(setSearchingActive(true))}
            src="/images/search.svg"
          />

          {loggedIn && (
          <img
            className={styles.borderCircle}
            src="/images/face.jpeg"
          />
          )}
          {!loggedIn && <Selector icon="/images/login.svg" name="Log in or Register" href="/login" />}
        </div>
      </header>
    );
  }

  return <NavInSearchMode />;
}

function NavInSearchMode() {
  const dispatch = useDispatch();

  return (
    <header className={styles.container}>
      <div className={styles.searchcontainer}>
        <img
          className={styles.searchiconactive}
          src="/images/search.svg"
        />

        <SearchBar />

        <div
          className={styles.cancelsearch}
          onClick={() => dispatch(setSearchingActive(false))}
        >
          {'\u2573'}
        </div>
      </div>
    </header>
  );
}
