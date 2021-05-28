import { useState } from 'react';

import styles from '../../styles/navbar.module.css';
import ProfileMenu from './ProfileMenu';

export default function Profile() {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div className={styles.profilecontainer}>
      <img
        alt="Profile"
        className={styles.borderCircle}
        src="/images/face.jpeg"
        onClick={() => setShowMenu(!showMenu)}
      />
      {showMenu && <ProfileMenu />}
    </div>
  );
}
