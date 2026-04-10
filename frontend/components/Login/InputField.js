import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/login.module.css';

export default function InputField(properties) {
  const inputClassName = properties.readOnly
    ? `${styles.input} ${styles.readonlyInput}`
    : styles.input;

  return (
    <div className={styles.inputcontainer}>
      <div className={styles.inputiconcontainer}>
        <FontAwesomeIcon
          icon={properties.icon}
          size="1x"
          color={`${properties.highlight ? '#84DCCF' : '#00A1E4'}`}
        />
      </div>
      <input
        value={properties.value}
        onChange={event => properties.onChange(event)}
        onKeyPress={event => properties.onKeyPress(event)}
        className={inputClassName}
        placeholder={properties.placeholder}
        type={properties.type}
        ref={properties.inputRef}
        readOnly={properties.readOnly}
        disabled={properties.disabled}
      />
    </div>
  );
}
