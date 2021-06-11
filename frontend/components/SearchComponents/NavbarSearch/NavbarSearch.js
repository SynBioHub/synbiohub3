import { faTimesCircle } from '@fortawesome/free-regular-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import styles from '../../../styles/navbar.module.css';
import SearchBar from './SearchBar';

export default function NavbarSearch() {
  const router = useRouter();
  const [hoveringClose, setHoveringClose] = useState(false);
  const pageVisited = useSelector(state => state.tracking.pageVisited);

  return (
    <header className={styles.container}>
      <div className={styles.searchcontainer}>
        <FontAwesomeIcon
          icon={faSearch}
          className={styles.searchiconactive}
          color="#F2E86D"
          size="2x"
        />

        <SearchBar />

        <FontAwesomeIcon
          icon={faTimesCircle}
          size="2x"
          color="#F2E86D"
          spin={hoveringClose}
          className={styles.cancelsearch}
          onClick={() => {
            if (pageVisited) router.back();
            else router.push('/');
          }}
          onMouseEnter={() => setHoveringClose(true)}
          onMouseLeave={() => setHoveringClose(false)}
        />
      </div>
    </header>
  );
}
