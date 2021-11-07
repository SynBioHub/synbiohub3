import styles from '../../styles/defaulttable.module.css';

export default function TableButtonDropdown(properties) {
  return (
    <div
      className={styles.tablebuttondropdown}
      role="button"
      onClick={() => properties.onClick()}
    >
      {properties.title}
    </div>
  );
}
