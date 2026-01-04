import {
  faGlobeAmericas,
  faShareAlt,
  faUserLock
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { processUrl } from '../Admin/Registries';
import { useSelector } from 'react-redux';
import axios from 'axios';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

import styles from '../../styles/submissions.module.css';

export default function SubmissionDisplay(properties) {
  const router = useRouter();
  const token = useSelector(state => state.user.token);

  const [privacyDisplay, setPrivacyDisplay] = useState();
  const [processedUri, setProcessedUri] = useState(properties.submission.uri);
  const registries = JSON.parse(localStorage.getItem("registries")) || {};

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
      const result = await processUrl(properties.submission.uri, registries);
      setProcessedUri(result.urlRemovedForLink || result.original);
    }

    processAndSetUri();
  }, [properties.submission.uri]);

  const generateShareLink = async (uri) => {
    try {
      // Extract the path from the full URI
      const urlObj = new URL(uri);
      const path = urlObj.pathname;
      const url = `${publicRuntimeConfig.backend}${path}/shareLink`;
      const headers = {
        Accept: "text/plain; charset=UTF-8",
        "X-authorization": token
      };
      const response = await axios.get(url, { headers });
      if (response.status === 200 && response.data) {
        const originalUrl = response.data;
        const urlObj = new URL(originalUrl);
        
        const theme = JSON.parse(localStorage.getItem('theme')) || {};
        const base = theme.frontendURL.endsWith('/')
          ? theme.frontendURL.slice(0, -1)
          : theme.frontendURL;

        const path = urlObj.pathname.startsWith('/')
          ? urlObj.pathname
          : '/' + urlObj.pathname;

        // Append /share to make it a proper share link
        const sharePath = path.endsWith('/') ? path + 'share' : path;
        
        return base + sharePath + urlObj.search + urlObj.hash;
      }
    } catch (error) {
      console.error("Error fetching share link:", error.message);
    }
    return null;
  };

  const handleRowClick = async () => {
    if (properties.submission.privacy === 'shared') {
      const shareLink = await generateShareLink(properties.submission.uri);
      if (shareLink) {
        router.push(shareLink);
      } else {
        // Fallback to processed URI if share link generation fails
        router.push(processedUri);
      }
    } else {
      router.push(processedUri);
    }
  };

  return (
    <tr
      key={properties.submission.displayId}
      className={styles.submission}
      onClick={handleRowClick}
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
