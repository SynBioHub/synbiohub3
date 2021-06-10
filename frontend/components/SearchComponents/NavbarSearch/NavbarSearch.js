import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import styles from '../../../styles/navbar.module.css';
import SearchBar from './SearchBar';

export default function NavbarSearch() {
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

        <div className={styles.cancelsearch}>
          <Image
            role="button"
            src="/images/closesearch.svg"
            width={20}
            height={20}
            onClick={() => {
              if (pageVisited) router.back();
              else router.push('/');
            }}
          />
        </div>
      </div>
    </header>
  );
}
