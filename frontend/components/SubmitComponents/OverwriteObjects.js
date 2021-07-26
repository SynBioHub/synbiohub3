import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

  return (
    <div className={styles.overwritecontainer}>
      <div className={styles.overwriteinputcontainer}>
        <input
          type="checkbox"
          checked={properties.checked}
          onChange={event => {
            if (event.target.checked && enablePrompt) setWarnUser(true);
            else properties.setChecked(event.target.checked);
          }}
        />
        <div className={styles.overwritemessage}>
          Overwrite Existing Collection
        </div>
      </div>
      <div>
        <a
          href="https://wiki.synbiohub.org/userdocumentation/managingsubmitting#411-creating-a-new-collection"
          target="_blank"
          rel="noreferrer"
        >
          <FontAwesomeIcon
            icon={faInfoCircle}
            size="1x"
            className={`${styles.submitinfoicon} ${styles.enlargeicononhover}`}
            color="#00A1E4"
          />
        </a>
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
