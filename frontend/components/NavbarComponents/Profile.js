import Image from 'next/image';
import { useState } from 'react';

import styles from '../../styles/navbar.module.css';
import ProfileMenu from './ProfileMenu';

export default function Profile() {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div className={styles.profilecontainer}>
      <Image
        alt="Profile"
        className={styles.borderCircle}
        src="/images/user.svg"
        width={30}
        height={30}
        onClick={() => setShowMenu(!showMenu)}
      />
      {showMenu && <ProfileMenu />}
    </div>
  );
}
