import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

import styles from '../../../styles/searchheader.module.css';

/**
 * This component is used to select what type of search the user wishes to conduct
 * (such as standard, sequence, etc)
 */
export default function SearchTypeSelector(properties) {
  const extraClass =
    properties.selected === properties.name
      ? styles.categoryselected
      : styles.notselected;

  return (
    <Link href={`/${properties.route}`}>
      <a className={`${styles.categoryheader} ${extraClass}`}>
        {properties.icon ? (
          <FontAwesomeIcon
            icon={properties.icon}
            size="1x"
            className={styles.icon}
          />
        ) : null}
        <p className={styles.categoryname}>{properties.name}</p>
      </a>
    </Link>
  );
}
