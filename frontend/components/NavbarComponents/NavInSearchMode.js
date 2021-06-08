import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import styles from '../../styles/navbar.module.css';
import SearchBar from './SearchBar';

export default function NavInSearchMode() {
  const router = useRouter();
  const pageVisited = useSelector(state => state.tracking.pageVisited);

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
            if (pageVisited) router.back();
            else router.push('/');
          }}
        >
          {'\u2573'}
        </div>
      </div>
    </header>
  );
}
