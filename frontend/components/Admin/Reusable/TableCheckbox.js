import styles from '../../../styles/admin.module.css';

export default function TableInput(properties) {
  return (
    <input
      type="checkbox"
      className={styles.tableinput}
      value={properties.value}
      onChange={event => properties.onChange(event)}
      placeholder={properties.placeholder}
    />
  );
}
