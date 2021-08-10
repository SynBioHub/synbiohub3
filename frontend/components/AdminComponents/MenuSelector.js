import Link from 'next/link';
import { useEffect, useState } from 'react';

import styles from '../../styles/admin.module.css';

export default function MenuSelector(properties) {
  const [style, setStyle] = useState('');
  useEffect(() => {
    if (properties.selected && properties.selected === properties.route)
      setStyle(styles.menuselectorselected);
    else setStyle('');
  }, [properties.selected]);
  return (
    <Link href={`/admin/${properties.route}`}>
      <a className={`${styles.menuselector} ${style}`}>{properties.name}</a>
    </Link>
  );
}
