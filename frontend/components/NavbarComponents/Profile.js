import Image from 'next/image';
import { useState } from 'react';

import styles from '../../styles/navbar.module.css';
import ProfileMenu from './ProfileMenu';

export default function Profile() {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div className={styles.profilecontainer}>
      <div className={styles.iconcontainer}>
        <Image
          alt="Profile"
          src="/images/user.svg"
          width={28}
          height={28}
          onClick={() => setShowMenu(!showMenu)}
        />
      </div>
      {showMenu && <ProfileMenu />}
    </div>
  );
}
