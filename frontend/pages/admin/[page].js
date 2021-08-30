import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import Content from '../../components/AdminComponents/Content';
import Menu from '../../components/AdminComponents/Menu';
import TopLevel from '../../components/TopLevel';
import styles from '../../styles/admin.module.css';

function Admin() {
  const isAdmin = useSelector(state => state.user.isAdmin);
  const router = useRouter();
  const { page } = router.query;

  useEffect(() => {
    if (!isAdmin) router.replace('/');
  }, [isAdmin]);
  if (isAdmin)
    return (
      <div className={styles.container}>
        <Menu selected={page} />
        <Content selected={page} />
      </div>
    );
  return null;
}

export default function AdminWrapped() {
  return (
    <TopLevel>
      <Admin />
    </TopLevel>
  );
}
