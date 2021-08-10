import styles from '../../styles/admin.module.css';

export default function MenuSelector(properties) {
  return <div className={styles.menuselector}>{properties.name}</div>;
}
