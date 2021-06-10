import { useRouter } from 'next/router';

import styles from '../../styles/navbar.module.css';
import SearchBar from './SearchBar';

export default function NavInSearchMode() {
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
          onClick={() => router.push('/')}
        >
          {'\u2573'}
        </div>
      </div>
    </header>
  );
}
