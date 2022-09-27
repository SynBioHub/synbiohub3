import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/view.module.css';

import Link from 'next/link';

import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default function ViewHeader(properties) {
  return (
    <div>
      <div className={styles.contentheader}>
        <h1 className={styles.maintitle}>{properties.name}</h1>
        <Link href={`${publicRuntimeConfig.backend}/search/displayId='${properties.displayId}'&`}>
          <a title="Find all records with the same identifier" target="_blank">
            <h1 className={styles.maintitleid}>({properties.displayId})</h1>
          </a>
        </Link>
      </div>
      <div className={styles.contentinfo}>
        <Link href={`http://sbols.org/v2#${properties.type}`}>
          <a title="Learn more about this RDF type" target="_blank">
            <FontAwesomeIcon
              icon={faDatabase}
              size="1x"
              className={styles.contentinfoicon}
            />
            {properties.type}
          </a>
        </Link>
      </div>
      <Link href={`${publicRuntimeConfig.backend}/search/?q=${properties.description}`}>
        <a className={styles.description} title="Find all records with terms in common with this description" target="_blank">
          <div>{properties.description}</div>
        </a>
      </Link>
    </div>
  );
}
