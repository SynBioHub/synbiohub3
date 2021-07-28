import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/login.module.css';

export default function InputField(properties) {
  return (
    <div className={styles.inputcontainer}>
      <div className={styles.inputiconcontainer}>
        <FontAwesomeIcon icon={properties.icon} size="1x" color="#00A1E4" />
      </div>
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
