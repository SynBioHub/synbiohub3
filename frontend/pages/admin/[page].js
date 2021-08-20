import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import Content from '../../components/AdminComponents/Content';
import Menu from '../../components/AdminComponents/Menu';
import TopLevel from '../../components/TopLevel';
import styles from '../../styles/admin.module.css';

function Admin() {
  const router = useRouter();
  const { page } = router.query;
  return (
    <div className={styles.container}>
      <Menu selected={page} />
      <Content selected={page} />
    </div>
  );
}

export default function AdminWrapped() {
  const isAdmin = useSelector(state => state.user.isAdmin);
  return (
    <TopLevel blockEntry={!isAdmin}>
      <Admin />
    </TopLevel>
  );
}
