import {
  faAlignLeft,
  faBoxOpen,
  faCloudUploadAlt,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

import Card from '../components/Home/Card';
import TopLevel from '../components/TopLevel';
import styles from '../styles/home.module.css';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import showdown from "showdown"
import getConfig from 'next/config';
const sdconverter = new showdown.Converter()
const { publicRuntimeConfig } = getConfig();

/**
 * This page renders the home/landing page for sbh.
 */
function Home() {
  const [frontPageText, setFrontPageText] = useState('Loading front page text...');
  const token = useSelector(state => state.user.token);
  const themeData = JSON.parse(localStorage.getItem('theme') || '{}');

  // new: logo state (prefer theme stored value, then separate sbh_logo entry)
  const [logoUrl, setLogoUrl] = useState(themeData.logoUrl || localStorage.getItem('sbh_logo') || null);

  useEffect(() => {
    // Attempt to retrieve frontPageText from localStorage

    if (themeData.frontPageText) {
      // Convert Markdown to HTML if data is found
      setFrontPageText(sdconverter.makeHtml(themeData.frontPageText.replace(/\\n/g, '\n')));
    } else {
      // Set fallback text if data is not found
      setFrontPageText('Welcome to SynBioHub! Refresh to ensure front page text is loaded.');

      // Store a local storage entry that counts up to 3 reloads
      const reloadCount = parseInt(localStorage.getItem('reloadCount') || '0', 10);
      if (reloadCount < 3) {
        // Refresh the page to ensure front page text is loaded
        setTimeout(() => {
          localStorage.setItem('reloadCount', reloadCount + 1);
          window.location.reload();
        }, 1500);
      }
    }

    // new: fetch logo endpoint if we don't already have one
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
            // store in localStorage and theme object for reuse
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
        .catch(() => { /* ignore if no logo available */ });
    }
  }, []); // run once on mount

  return (
    <div className={styles.container}>
      
      <main className={styles.main}>
        {/* render logo at top if available */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Instance Logo"
            style={{ maxWidth: '800px', height: 'auto', maxHeight: '10rem', marginBottom: '1rem' }}
          />
        )}

        <h1 className={styles.title}>
          Welcome to{' '}
          <a
            href="https://wiki.synbiohub.org/"
            rel="noreferrer"
            target="_blank"
          >
            {themeData.instanceName || 'SynBioHub'}!
          </a>
        </h1>
        
        <p className={styles.description} dangerouslySetInnerHTML={{__html: frontPageText}} />

        <div className={styles.grid}>
          <Card
            description="Browse SynBioHub for useful parts and designs"
            icon={faSearch}
            title="Search"
            route={'/search'}
            redirect={false}
          />

          <Card
            description="Upload your parts and designs for safekeeping"
            icon={faCloudUploadAlt}
            title="Submit Designs"
            route={'/submit'}
            redirect={true}
          />

          <Card
            description="Prepare designs for publication or collaboration"
            icon={faAlignLeft}
            title="Manage Submissions"
            route={'/submissions'}
            redirect={true}
          />

          <Card
            description="View collections made available to the public"
            icon={faBoxOpen}
            title="View Collections"
            route={'/root-collections'}
            redirect={true}
          />
        </div>
      </main>
    </div>
  );
}

export default function HomeWrapped() {
  return (
    <TopLevel publicPage={true}>
      <Home />
    </TopLevel>
  );
}
