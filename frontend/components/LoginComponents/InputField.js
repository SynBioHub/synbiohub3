import styles from '../../styles/login.module.css';

export default function InputField(properties) {
  return (
    <div className={styles.inputcontainer}>
      <input
        value={properties.value}
        onChange={event => properties.onChange(event)}
        onKeyPress={event => properties.onKeyPress(event)}
        className={styles.input}
        placeholder={properties.placeholder}
        type={properties.type}
        ref={properties.ref}
      />
    </div>
  );
}
