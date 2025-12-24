import {
  faAlignLeft,
  faCloudUploadAlt,
  faSearch,
  faSignInAlt,
  faHome
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import Loader from 'react-loader-spinner';
import { useSelector } from 'react-redux';
import styles from '../../styles/navbar.module.css';
import Profile from './Profile';
import Selector from './Selector';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

/**
 * This component renders the navigation bar at the top of sbh. Users use this to access
 * submissions, shared submissions, search, profile, admin page, and possibly more
 */
export default function Navbar() {
  const loggedIn = useSelector(state => state.user.loggedIn);
  const submitting = useSelector(state => state.submit.submitting);
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const defaultLogo = '/images/logo.svg'

  const [profileControl, setProfileControl] = useState(
    <Selector icon={faSignInAlt} name="Log in or Register" href="/login" />
  );

  // initialize logo like index.js: prefer theme.logoUrl, then localStorage 'sbh_logo', else null/default
  const [logoUrl, setLogoUrl] = useState(theme.logoUrl || localStorage.getItem('sbh_logo') || null);
  const [navbarWidth, setNavbarWidth] = useState('100%');
  const navbarRef = useRef(null);

  useEffect(() => {
    if (loggedIn) {
      setProfileControl(<Profile />);
    } else {
      setProfileControl(
        <Selector icon={faSignInAlt} name="Sign In" href="/login" />
      );
    }
  }, [loggedIn]);

  let linkHref = "/";
  if (theme && theme.altHome && theme.altHome.length > 0) {
    linkHref = theme.altHome;
  }

  // fetch logo from backend/logo if we don't already have one (same approach as index.js)
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
      <div className={styles.logoAndInstanceContainer}>
          <Selector
            icon={faHome}
            href={linkHref}
            logoUrl={logoUrl}
            name={theme.instanceName || 'SynBioHub'}
            defaultLogo={defaultLogo}
            isInstanceName={true}
          />
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

        <Link href="/search">
          <a>
            <FontAwesomeIcon
              icon={faSearch}
              size="2x"
              alt="Search SynBioHub"
              className={styles.searchicon}
            />
          </a>
        </Link>

        {profileControl}
      </div>
    </header>
  );
}
