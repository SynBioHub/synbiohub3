import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';

import styles from '../../styles/defaulttable.module.css';

export default function TableButton(properties) {
  const [buttonClass, setButtonClass] = useState(styles.disabled);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setButtonClass(properties.enabled ? styles.enabled : styles.disabled);
    if (!properties.enabled) setShowDropdown(false);
  }, [properties.enabled]);

  return (
    <div className={styles.buttoncontainer}>
      <div
        className={`${styles.tablebutton} ${buttonClass} ${styles.rightspace}`}
        role="button"
        onClick={() => {
          if (properties.enabled) {
            if (properties.dropdown) setShowDropdown(!showDropdown);
            else properties.onClick();
          }
        }}
      >
        <span className={styles.buttonicon}>
          <FontAwesomeIcon icon={properties.icon} color="#00000" size="1x" />
        </span>
        {properties.title}
      </div>
      <Dropdown
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        dropdown={properties.dropdown}
      />
    </div>
  );
}

function Dropdown(properties) {
  const reference = useRef(null);

  const handleClickOutside = event => {
    if (reference.current && !reference.current.contains(event.target)) {
      properties.setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  });

  return properties.showDropdown ? (
    <div className={styles.dropdowncontainer} ref={reference}>
      {properties.dropdown}
    </div>
  ) : null;
}
