import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  setOffset,
  setSearchingActive,
  setSearchQuery
} from '../redux/actions';
import styles from '../styles/navbar.module.css';
import Profile from './NavbarComponents/Profile';
import SearchBar from './NavbarComponents/SearchBar';
import Selector from './NavbarComponents/Selector';

/**
 * This component renders the navigation bar at the top of sbh. Users use this to access
 * submissions, shared submissions, search, profile, admin page, and possibly more
 */
export default function Navbar() {
  const searchingOpen = useSelector(state => state.search.active);
  const dispatch = useDispatch();
  const loggedIn = useSelector(state => state.user.loggedIn);
  const router = useRouter();

  useEffect(() => {
    if (router.query.search !== undefined) {
      dispatch(setSearchingActive(true));
      dispatch(setSearchQuery(router.query.search));
      if (router.query.offset)
        dispatch(setOffset(Number.parseInt(router.query.offset)));
      else dispatch(setOffset(0));
    } else {
      dispatch(setSearchingActive(false));
    }
  }, [router.query.search]);

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
                href="/shared"
              />

              <Selector
                icon="/images/submissions_white.svg"
                name="Submissions"
                href="/submissions"
              />
            </nav>
          )}

          <img
            alt="Search SynBioHub"
            className={styles.searchicon}
            onClick={() => dispatch(setSearchingActive(true))} // open search panel
            src="/images/search.svg"
          />

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

  return <NavInSearchMode />;
}

function NavInSearchMode() {
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <header className={styles.container}>
      <div className={styles.searchcontainer}>
        <img
          className={styles.searchiconactive}
          src="/images/search.svg"
          alt=""
        />

        <SearchBar />

        <div
          role="button"
          className={styles.cancelsearch}
          onClick={() => {
            dispatch(setSearchingActive(false));
            router.replace(router.pathname);
          }}
        >
          {'\u2573'}
        </div>
      </div>
    </header>
  );
}
