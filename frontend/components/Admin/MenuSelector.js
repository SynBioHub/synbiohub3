import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import styles from '../../styles/admin.module.css';

export default function MenuSelector(properties) {
  const [style, setStyle] = useState(styles.menuselectoractive);
  // useEffect(() => {
  //   if (properties.selected && properties.selected === properties.route) {
  //     setStyle(styles.menuselectorselected);
  //   } else setStyle(styles.menuselectoractive);
  // }, [properties.selected]);

  const isSelected = properties.selected && properties.selected === properties.route;

  // Inline style for the selected item
  const selectedStyle = isSelected ? { backgroundColor: properties.themeColor } : {};

  useEffect(() => {
    if (isSelected) {
      setStyle(`${styles.menuselector} ${styles.menuselectorselected}`);
    } else {
      setStyle(`${styles.menuselector} ${styles.menuselectoractive}`);
    }
  }, [properties.selected, properties.route]);

  // useEffect(() => {
  //   if (properties.selected && properties.selected === properties.route) {
  //     setStyle({ backgroundColor: properties.themeColor || '#00A1E4' }); // Replace 'defaultColor' with a fallback color
  //   } else {
  //     setStyle({});
  //   }
  // }, [properties.selected, properties.themeColor]);


  return (
    <Link href={`/admin/${properties.route}`}>
      <a className={`${styles.menuselector} ${isSelected ? styles.menuselectorselected : styles.menuselectoractive}`}
         style={selectedStyle}>
        <div className={styles.menuselectoricon}>
          <FontAwesomeIcon icon={properties.icon} size="1x" />
        </div>
        {properties.name}
      </a>
    </Link>
  );
}
