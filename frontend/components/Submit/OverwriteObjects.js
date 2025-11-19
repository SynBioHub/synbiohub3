import { useEffect, useState } from 'react';

import styles from '../../styles/submit.module.css';
import Message from '../Message';

export default function OverwriteObjects(properties) {
  const [warnUser, setWarnUser] = useState(false);
  const [enablePrompt, setEnablePrompt] = useState(true);

  useEffect(() => {
    if (!enablePrompt) localStorage.setItem('PromptOverwrite', enablePrompt);
  }, [enablePrompt]);

  useEffect(() => {
    const promptUser = localStorage.getItem('PromptOverwrite');
    switch (promptUser) {
      case 'true':
        setEnablePrompt(true);
        break;
      case 'false':
        setEnablePrompt(false);
        break;
      default:
        setEnablePrompt(true);
        break;
    }
  }, []);

  const handleContainerClick = () => {
    if (!properties.checked && enablePrompt) {
      setWarnUser(true);
    } else {
      properties.setChecked(!properties.checked);
    }
  };

  return (
    <div className={styles.overwritecontainer}>
      <div 
        className={styles.overwriteinputcontainer}
        onClick={handleContainerClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleContainerClick();
          }
        }}
      >
        <input
          type="checkbox"
          checked={properties.checked}
          onChange={() => {}} // Controlled by container click
          readOnly
        />
        <div className={styles.overwritemessage}>
          Overwrite Existing Collection
        </div>
      </div>
      {warnUser && enablePrompt ? (
        <Message
          message="Are you sure you want to overwrite existing objects in the collection? All objects currently existing in the collection will be lost."
          buttontext="Confirm"
          setPromptUser={newEnablePrompt => setEnablePrompt(newEnablePrompt)}
          close={(newEnablePrompt = true) =>
            handlePromptOverwrite(
              false,
              properties.setChecked,
              setWarnUser,
              setEnablePrompt,
              newEnablePrompt
            )
          }
          action={(newEnablePrompt = true) =>
            handlePromptOverwrite(
              true,
              properties.setChecked,
              setWarnUser,
              setEnablePrompt,
              newEnablePrompt
            )
          }
        />
      ) : null}
    </div>
  );
}

const handlePromptOverwrite = (
  overwrite,
  setChecked,
  setWarnUser,
  setEnablePrompt,
  newEnablePrompt = true
) => {
  setChecked(overwrite);
  setWarnUser(false);
  setEnablePrompt(newEnablePrompt);
};
