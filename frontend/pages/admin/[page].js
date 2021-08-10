import { useRouter } from 'next/router';

import Menu from '../../components/AdminComponents/Menu';
import TopLevel from '../../components/TopLevel';
import styles from '../../styles/admin.module.css';

function Admin() {
  const router = useRouter();
  const { page } = router.query;
  return (
    <div className={styles.container}>
      <Menu selected={page} />
      <div className={styles.content}></div>
    </div>
  );
}

export default function AdminWrapped() {
  return (
    <TopLevel>
      <Admin />
    </TopLevel>
  );
}
