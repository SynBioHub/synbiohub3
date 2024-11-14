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
// var showdown  = require('showdown'),
//     sdconverter = new showdown.Converter()
import showdown from "showdown"
const sdconverter = new showdown.Converter()

/**
 * This page renders the home/landing page for sbh.
 */
function Home() {
  const [frontPageText, setFrontPageText] = useState('Loading front page text...');
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    // Attempt to retrieve frontPageText from localStorage
    const themeData = JSON.parse(localStorage.getItem('theme') || '{}');

    if (themeData.frontPageText) {
      // Convert Markdown to HTML if data is found
      setFrontPageText(sdconverter.makeHtml(themeData.frontPageText.replace(/\\n/g, '\n')));
    } else {
      // Set fallback text if data is not found
      setFrontPageText('Welcome to SynBioHub! Refresh to ensure front page text is loaded.');
    }
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to{' '}
          <a
            href="https://wiki.synbiohub.org/"
            rel="noreferrer"
            target="_blank"
          >
            SynBio<span className={styles.hubtitle}>Hub</span>
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
