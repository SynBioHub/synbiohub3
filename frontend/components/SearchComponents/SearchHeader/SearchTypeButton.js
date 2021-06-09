import Link from 'next/link';

import styles from '../../../styles/searchheader.module.css';

/**
 * This component is used to select what type of search the user wishes to conduct
 * (such as standard, sequence, etc)
 */
export default function SearchTypeSelector(properties) {
  const extraClass =
    properties.selected === properties.name ? styles.categoryselected : '';

  return (
    <Link href={`/${properties.route}`}>
      <a className={styles.categoryheader}>
        <p className={`${styles.categoryname} ${extraClass}`}>
          {properties.name}
        </p>
      </a>
    </Link>
  );
}
