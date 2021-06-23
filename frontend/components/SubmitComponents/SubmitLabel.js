import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../../styles/submit.module.css';

export default function SubmitLabel(properties) {
  if (!properties.required)
    return (
      <label
        htmlFor={properties.for}
        className={`${styles.submitlabel} ${styles.submitlabeloptional}`}
      >
        {properties.text}
      </label>
    );
  return (
    <label
      className={`${styles.submitlabel} ${
        properties.verified && styles.submitlabelverified
      }`}
      htmlFor={properties.for}
    >
      {properties.text}
      <FontAwesomeIcon
        icon={faCheckCircle}
        size="1x"
        className={`${styles.inputstatus} ${
          properties.verified && styles.inputstatusshow
        }`}
        color="#549F93"
      />
    </label>
  );
}
