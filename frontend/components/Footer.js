import Image from 'next/image';

import styles from '../styles/footer.module.css';

import { useState, useEffect } from 'react';

/**
 * This component renders the footer in sbh
 */
export default function Footer() {
  const [commitHash, setCommitHash] = useState('');

  useEffect(() => {
    fetch('/commitHash.txt')
      .then(response => response.text())
      .then(hash => setCommitHash(hash.slice(0, 8)));
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.copyrightcontainer}>
        <Image
          alt="logo"
          width={80}
          height={80}
          src="/images/logo_secondary.svg"
        />
        <div className={styles.copyright}>
          ©2018 <br />
          <a
            href="https://www.utah.edu/"
            target="_blank"
            rel="noreferrer"
            className={styles.institution}
          >
            University of Utah
          </a>
          <br />
          <a
            href="https://www.colorado.edu/"
            target="_blank"
            rel="noreferrer"
            className={styles.institution}
          >
            University of Colorado Boulder
          </a>
          <br />
          Other Collaborators
        </div>
      </div>
      <div className={styles.sbhinfo}>
        <a href="https://wiki.synbiohub.org/" target="_blank" rel="noreferrer">
          Docs
        </a>
        <a
          href="https://wiki.synbiohub.org/api-docs/"
          target="_blank"
          rel="noreferrer"
        >
          API
        </a>
        <a
          href={`https://github.com/SynBioHub/synbiohub3/commit/${commitHash}`} // Incorporate the commit hash into the link
          target="_blank"
          rel="noreferrer"
        >
          Github Repo ({commitHash}) {/* Display the trimmed commit hash */}
        </a>
        <a
          href="https://github.com/SynBioHub/synbiohub3/issues"
          target="_blank"
          rel="noreferrer"
        >
          Report Issue
        </a>
      </div>
    </footer>
  );
}
