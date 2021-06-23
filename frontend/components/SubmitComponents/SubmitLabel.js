import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

import styles from '../../styles/submit.module.css';

export default function SubmitLabel(properties) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (properties.verifier) properties.verifier(properties.value);
    else setVerified(properties.value ? true : false);
  });

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
        verified && styles.submitlabelverified
      }`}
      htmlFor={properties.for}
    >
      {properties.text}
      <FontAwesomeIcon
        icon={faCheckCircle}
        size="1x"
        className={`${styles.inputstatus} ${
          verified && styles.inputstatusshow
        }`}
        color="#549F93"
      />
    </label>
  );
}