import {
  faGlobeAmericas,
  faShareAlt,
  faUserLock
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { processUrl } from '../Admin/Registries';
import { useDispatch, useSelector } from 'react-redux';

import styles from '../../styles/submissions.module.css';

export default function SubmissionDisplay(properties) {
  const router = useRouter();

  const [privacyDisplay, setPrivacyDisplay] = useState();
  const [processedUri, setProcessedUri] = useState(properties.submission.uri);
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();

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

  useEffect(() => {
    async function processAndSetUri() {
      const result = await processUrl(properties.submission.uri, localStorage.getItem('registries'));
      setProcessedUri(result.urlRemovedForLink || result.original);
    }

    processAndSetUri();
  }, [properties.submission.uri]);

  return (
    <tr
      key={properties.submission.displayId}
      className={styles.submission}
      onClick={() => {
        router.push(
          processedUri
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
