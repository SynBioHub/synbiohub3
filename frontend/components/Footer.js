import Image from 'next/image';

import styles from '../styles/footer.module.css';

/**
 * This component renders the footer in sbh
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.copyrightcontainer}>
        <Image alt="logo" width={80} height={80} src="/images/logo_light.svg" />
        <div className={styles.copyright}>
          ©2018{' '}
          <a
            href="https://www.utah.edu/"
            target="_blank"
            rel="noreferrer"
            className={styles.institution}
          >
            University of Utah
          </a>
          {'  &  '}
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
          href="https://github.com/SynBioHub/synbiohub3"
          target="_blank"
          rel="noreferrer"
        >
          Github Repo
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
