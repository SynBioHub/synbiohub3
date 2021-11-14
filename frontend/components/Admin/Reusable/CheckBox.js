import styles from '../../../styles/admin.module.css';

export default function Checkbox(properties) {
  return (
    <input
      type="checkbox"
      className={`${styles.tableinput} ${
        properties.permanent ? styles.permanent : ''
      }`}
      checked={properties.value}
      onChange={event => {
        if (!properties.permanent) properties.onChange(event);
      }}
    />
  );
}
