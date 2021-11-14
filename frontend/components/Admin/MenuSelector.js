import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import styles from '../../styles/admin.module.css';

export default function MenuSelector(properties) {
  const [style, setStyle] = useState(styles.menuselectoractive);
  useEffect(() => {
    if (properties.selected && properties.selected === properties.route)
      setStyle(styles.menuselectorselected);
    else setStyle(styles.menuselectoractive);
  }, [properties.selected]);
  return (
    <Link href={`/admin/${properties.route}`}>
      <a className={`${styles.menuselector} ${style}`}>
        <div className={styles.menuselectoricon}>
          <FontAwesomeIcon icon={properties.icon} size="1x" />
        </div>
        {properties.name}
      </a>
    </Link>
  );
}
