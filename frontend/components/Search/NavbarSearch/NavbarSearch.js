import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import Profile from '../../Navbar/Profile';
import Selector from '../../Navbar/Selector';
import {
  faAlignLeft,
  faCloudUploadAlt,
  faSearch,
  faSignInAlt,
  faBackward
} from '@fortawesome/free-solid-svg-icons';
import Loader from 'react-loader-spinner';


import styles from '../../../styles/navbar.module.css';
import SearchBar from './SearchBar';

export default function NavbarSearch(properties) {
  const router = useRouter();
  const pageVisited = useSelector(state => state.tracking.pageVisited);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const defaultLogo = '/images/logo.svg';
  const loggedIn = useSelector(state => state.user.loggedIn);
  const submitting = useSelector(state => state.submit.submitting);

  const [profileControl, setProfileControl] = useState(
      <Selector icon={faSignInAlt} name="Log in or Register" href="/login" />
    );

  const [navbarWidth, setNavbarWidth] = useState('100%');
  const navbarRef = useRef(null);

  let linkHref = "/";
  if (theme && theme.altHome && theme.altHome.length > 0) {
    linkHref = theme.altHome;
  }

  const [logoUrl, setLogoUrl] = useState(defaultLogo);

  useEffect(() => {
    const calculateWidth = () => {
      // Get the full scrollable width of the page (including any horizontal scroll area)
      const scrollWidth = Math.max(
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth,
        document.body.scrollWidth
      );
      setNavbarWidth(`${scrollWidth}px`);
    };

    // Calculate width on mount
    calculateWidth();

    // Recalculate on window resize and load
    window.addEventListener('resize', calculateWidth);
    window.addEventListener('load', calculateWidth);

    // Also recalculate when content changes (debounced)
    const observer = new MutationObserver(calculateWidth);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      window.removeEventListener('resize', calculateWidth);
      window.removeEventListener('load', calculateWidth);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem('logo')) {
      const urlLogo = `${publicRuntimeConfig.backend}/logo`;
      setLogoUrl(urlLogo);
    } else {
      setLogoUrl(defaultLogo);
    }
  }, [publicRuntimeConfig.backend]);

  useEffect(() => {
      if (loggedIn) {
        setProfileControl(<Profile />);
      } else {
        setProfileControl(
          <Selector icon={faSignInAlt} name="Sign In" href="/login" />
        );
      }
    }, [loggedIn]);

  return (
    <header
      ref={navbarRef}
      className={styles.container}
      style={{
        backgroundColor: theme?.themeParameters?.[0]?.value || '#465775',
        width: navbarWidth,
        minWidth: navbarWidth
      }}
    >
      <Link href={linkHref}>
        <a className={styles.logo}>
          <Image
            alt="logo"
            src={logoUrl}
            width={80}
            height={80}
            style={{ maxHeight: '50px', height: 'auto', width: '80px' }}
          />
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
      <div className={styles.navcontainer}>
              {loggedIn && (
                <nav className={styles.nav}>
                  <Selector
                    icon={faCloudUploadAlt}
                    customIcon={
                      submitting ? (
                        <Loader
                          color="#F2E86D"
                          type="Puff"
                          height={25}
                          width={25}
                          className={styles.loader}
                        />
                      ) : undefined
                    }
                    name="Submit"
                    href="/submit"
                  />
                  <Selector
                    icon={faAlignLeft}
                    name="Submissions"
                    href="/submissions"
                  />
                </nav>
              )}
      
              {profileControl}
            </div>
    </header>
  );
}
