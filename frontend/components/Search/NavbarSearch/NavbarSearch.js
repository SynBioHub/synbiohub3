import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

  const navbarRef = useRef(null);

  let linkHref = "/";
  if (theme && theme.altHome && theme.altHome.length > 0) {
    linkHref = theme.altHome;
  }

  // initialize logo like Navbar.js: prefer theme.logoUrl, then localStorage 'sbh_logo', else null/default
  const [logoUrl, setLogoUrl] = useState(theme.logoUrl || localStorage.getItem('sbh_logo') || null);

  // fetch logo from backend/logo if we don't already have one (same approach as Navbar.js)
  useEffect(() => {
    if (!logoUrl) {
      fetch(`${publicRuntimeConfig.backend}/logo`, { method: 'GET', cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error('No logo');
          return res.blob();
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;
            try {
              localStorage.setItem('sbh_logo', dataUrl);
              const updatedTheme = JSON.parse(localStorage.getItem('theme') || '{}');
              updatedTheme.logoUrl = dataUrl;
              localStorage.setItem('theme', JSON.stringify(updatedTheme));
            } catch (e) { /* ignore storage errors */ }
            setLogoUrl(dataUrl);
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          // fallback to default
          setLogoUrl(defaultLogo);
        });
    }
  }, []); // run once on mount

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
        backgroundColor: theme?.themeParameters?.[0]?.value || '#465775'
      }}
    >
      <Link href={linkHref}>
        <a className={styles.logo}>
          <img
            alt="logo"
            src={logoUrl || defaultLogo}
            style={{ height: '50px', width: 'auto', maxWidth: '200px', objectFit: 'contain', marginTop: '0.5rem', marginBottom: '0.5rem', marginLeft: '0.5rem', marginRight: '0.5rem' }}
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
