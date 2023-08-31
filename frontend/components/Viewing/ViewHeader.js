import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

import Link from 'next/link';

import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default function ViewHeader(properties) {
  var displayTitle = properties.type;
  if (properties.type.includes('#')) {
    displayTitle = properties.type.split('#')[1];
  }
  var displayLink = properties.type;
  return (
    <div>
      <div className={styles.contentheader}>
        <h1 className={styles.maintitle}>{properties.name}</h1>
        <Link href={`/search/displayId='${properties.displayId}'&`}>
          <a title="Find all records with the same identifier" target="_blank">
            <h1 className={styles.maintitleid}>({properties.displayId})</h1>
          </a>
        </Link>
      </div>
      <div className={styles.contentinfo}>
        <Link href={displayLink}>
          <a title="Learn more about this RDF type" target="_blank">
            <FontAwesomeIcon
              icon={faDatabase}
              size="1x"
              className={styles.contentinfoicon}
            />
            {displayTitle}
          </a>
        </Link>
      </div>
      <Link href={`/search/?q=${properties.description}`}>
        <a className={styles.description} title="Find all records with terms in common with this description" target="_blank">
          <div>{properties.description}</div>
        </a>
      </Link>
    </div>
  );
}
