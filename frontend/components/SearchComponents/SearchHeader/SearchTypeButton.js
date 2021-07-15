import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import styles from '../../../styles/searchheader.module.css';

/**
 * This component is used to select what type of search the user wishes to conduct
 * (such as standard, sequence, etc)
 */
export default function SearchTypeSelector(properties) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(`/${properties.route}`);
  }, []);

  const extraClass =
    properties.selected === properties.name
      ? styles.categoryselected
      : styles.notselected;

  return (
    <div
      className={`${styles.categoryheader} ${extraClass}`}
      role="button"
      onClick={() => {
        if (!properties.external) router.replace(`/${properties.route}`);
        else router.push(`${process.env.backendUrl}/${properties.route}`);
      }}
    >
      {properties.icon ? (
        <FontAwesomeIcon
          icon={properties.icon}
          size="1x"
          className={styles.icon}
        />
      ) : null}
      <p className={styles.categoryname}>{properties.name}</p>
    </div>
  );
}
