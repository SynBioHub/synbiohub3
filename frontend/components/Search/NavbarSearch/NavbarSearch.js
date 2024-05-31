import { faBackward, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import styles from '../../../styles/navbar.module.css';
import SearchBar from './SearchBar';

export default function NavbarSearch(properties) {
  const router = useRouter();
  const pageVisited = useSelector(state => state.tracking.pageVisited);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};

  let linkHref = "/";
  if (theme && theme.altHome && theme.altHome.length > 0) {
    linkHref = theme.altHome;
  }

  return (
    <header className={styles.container}
    style={{ backgroundColor: theme?.themeParameters?.[0]?.value || '#465775' }} 
    >
      <Link href={linkHref}>
        <a className={styles.logo}>
          <Image alt="logo" width={86} height={86} src="/images/logo.svg" />
        </a>
      </Link>
      <div className={styles.searchcontainer}>
        <FontAwesomeIcon
          icon={faSearch}
          className={styles.searchiconactive}
          color="#fff"
          size="2x"
        />

        <SearchBar
          value={properties.value}
          placeholder={properties.placeholder}
          onChange={properties.onChange}
        />

        <div className={styles.cancelsearchcontainer}>
          <FontAwesomeIcon
            icon={faBackward}
            size="2x"
            color="#F2E86D"
            className={styles.cancelsearch}
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
