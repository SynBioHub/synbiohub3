import { useEffect, useState } from 'react';

import styles from '../../../styles/submit.module.css';
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
        link={properties.labelLink}
        for={properties.inputName}
        required={properties.setNeedsVerification ? true : false}
        verified={verified}
        style={properties.style}
      />
      <Input
        type={properties.customType || 'text'}
        name={properties.inputName}
        id={properties.inputName}
        value={properties.value}
        checked={properties.value}
        onChange={event => properties.onChange(event)}
        className={`${styles.submitinput} ${properties.customStyling}`}
        placeholder={properties.placeholder}
        disabled={properties.disabled}
        style={properties.inputStyle}
      >
        {
          (properties.options) ?
            properties.options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
            ))
          : null
        }
      </Input>
    </div>
  );
}
