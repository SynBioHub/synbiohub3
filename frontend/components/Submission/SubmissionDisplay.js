import {
  faGlobeAmericas,
  faShareAlt,
  faUserLock
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
const { publicRuntimeConfig } = getConfig();

import styles from '../../styles/submissions.module.css';

export default function SubmissionDisplay(properties) {
  console.log(properties.submission.uri);
  const router = useRouter();

  const [privacyDisplay, setPrivacyDisplay] = useState();

  useEffect(() => {
    if (properties.submission.privacy === 'public')
      setPrivacyDisplay(<FontAwesomeIcon icon={faGlobeAmericas} size="1x" />);
    else if (properties.submission.privacy === 'private')
      setPrivacyDisplay(
        <FontAwesomeIcon icon={faUserLock} color="#ff0000" size="1x" />
      );
    else
      setPrivacyDisplay(
        <FontAwesomeIcon icon={faShareAlt} color="#1C7C54" size="1x" />
      );
  }, [properties.submission.privacy]);

  return (
    <tr
      key={properties.submission.displayId}
      className={styles.submission}
      onClick={() => {
        router.push(
          properties.submission.uri.replace('https://synbiohub.org', '')
        );
      }}
    >
      <td>
        <input
          checked={properties.selected.get(properties.submission.displayId)}
          onChange={event => {
            properties.setSelected(
              new Map(
                properties.selected.set(
                  properties.submission.displayId,
                  event.target.checked
                )
              )
            );
          }}
          onClick={event => {
            event.stopPropagation();
          }}
          type="checkbox"
        />
      </td>
      <td>
        <code>{properties.submission.name}</code>
      </td>
      <td>{properties.submission.displayId}</td>
      <td>{properties.submission.description}</td>
      <td>{properties.submission.type}</td>
      <td>{privacyDisplay}</td>
    </tr>
  );
}
