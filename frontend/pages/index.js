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
  // "SynBioHub is a design repository for people designing biological constructs. It enables DNA and protein designs to be uploaded, then facilitates sharing and viewing of such designs. SynBioHub also facilitates searching for information about existing useful parts and designs by combining data from a variety of sources." 
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    const themeData = JSON.parse(localStorage.getItem('theme'), (key,value) => {
      if (key === 'frontPageText') {
        return sdconverter.makeHtml(value.replace(/\\n/g, '\n'));
      }
      return value;
    });
    
    if (themeData && themeData.frontPageText){
      setFrontPageText(
        themeData.frontPageText 
      );
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
