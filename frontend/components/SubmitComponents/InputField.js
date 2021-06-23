import { useEffect, useState } from 'react';

import styles from '../../styles/submit.module.css';
import SubmitLabel from './SubmitLabel';

export default function InputField(properties) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (properties.verifier) properties.verifier(properties.value);
    else setVerified(properties.value ? true : false);
  }, [properties.value]);

  useEffect(() => {
    if (properties.needsVerification === '' && !verified)
      properties.setNeedsVerification(properties.inputName);
    else if (verified && properties.needsVerification === properties.inputName)
      properties.setNeedsVerification('');
  }, [verified, properties.needsVerification]);

  const Input = !properties.customInput ? 'input' : properties.customInput;

  return (
    <div className={properties.containerStyling}>
      <SubmitLabel
        text={properties.labelText}
        for={properties.inputName}
        required={properties.setNeedsVerification ? true : false}
        verified={verified}
      />
      <Input
        type="text"
        name={properties.inputName}
        value={properties.value}
        onChange={event => properties.onChange(event)}
        className={`${styles.submitinput} ${properties.customStyling}`}
        placeholder={properties.placeholder}
      />
    </div>
  );
}
