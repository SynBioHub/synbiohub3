import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import styles from '../../styles/searchheader.module.css';

/**
 * This component is used to select what type of search the user wishes to conduct
 * (such as standard, sequence, etc)
 */
export default function SearchTypeSelector(properties) {
  const router = useRouter();

  useEffect(() => {
    if (properties.route) {
      router.prefetch(`/${properties.route}`);
    }
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
        if (properties.onClick) properties.onClick();
        else if (!properties.external) router.replace(`/${properties.route}`);
        else router.push(`${publicRuntimeConfig.backend}/${properties.route}`);
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
