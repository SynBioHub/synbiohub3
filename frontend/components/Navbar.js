import Link from 'next/link';

import { useDispatch, useSelector } from 'react-redux';
import Selector from './NavbarComponents/Selector';
import SearchBar from './NavbarComponents/SearchBar';
import { setSearchingActive } from '../redux/actions';

import styles from '../styles/navbar.module.css';

export default function Navbar() {
  const searchingOpen = useSelector((state) => state.search.active);
  const dispatch = useDispatch();

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
          <nav className={styles.nav}>
            <Selector
              icon="/images/submit_white.svg"
              name="Submit"
            />

            <Selector
              icon="/images/shared.svg"
              name="Shared With Me"
            />

            <Selector
              icon="/images/submissions_white.svg"
              name="Submissions"
            />
          </nav>

          <img
            className={styles.searchicon}
            onClick={() => dispatch(setSearchingActive(true))}
            src="/images/search.svg"
          />

          <img
            className={styles.borderCircle}
            src="/images/face.jpeg"
          />
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
