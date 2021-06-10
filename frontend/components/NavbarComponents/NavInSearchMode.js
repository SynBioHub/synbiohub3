import Image from 'next/image';
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

        <div className={styles.cancelsearch}>
          <Image
            role="button"
            src="/images/closesearch.svg"
            width={20}
            height={20}
            onClick={() => router.push('/')}
          />
        </div>
      </div>
    </header>
  );
}
