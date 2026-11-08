import { faTimesCircle, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

import styles from '../../styles/navbar.module.css';
import ProfileMenu from './ProfileMenu';

export default function Profile() {
  const [showMenu, setShowMenu] = useState(false);
  const [icon, setIcon] = useState(
    <FontAwesomeIcon
      icon={faUser}
      color="#fff"
      className={styles.iconheight}
      onClick={() => setShowMenu(true)}
    />
  );

  useEffect(() => {
    if (showMenu)
      setIcon(
        <FontAwesomeIcon
          icon={faTimesCircle}
          color="#7cc2fc"
          className={styles.iconheight}
          spin
          onClick={() => setShowMenu(false)}
        />
      );
    else
      setIcon(
        <FontAwesomeIcon
          icon={faUser}
          color="#fff"
          className={styles.iconheight}
          onClick={() => setShowMenu(true)}
        />
      );
  }, [showMenu]);

  return (
    <div className={styles.profilecontainer}>
      <div className={styles.iconcontainer}>{icon}</div>
      {showMenu && <ProfileMenu />}
    </div>
  );
}
