import getConfig from 'next/config';
import { useRouter } from 'next/router';

import styles from '../../styles/submissions.module.css';
const { publicRuntimeConfig } = getConfig();
import { processUrl } from '../Admin/Registries';

import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

export default function BasketItem(properties) {
  const router = useRouter();
  const token = useSelector(state => state.user.token); // assuming you use Redux for state management
  const dispatch = useDispatch();

  // Process the URI using processUrl function
  const handleClick = async () => {
    const processedUrlData = await processUrl(properties.item.uri, localStorage.getItem('registries'));
    if (processedUrlData.urlReplacedForBackend) {
      router.push(processedUrlData.urlReplacedForBackend);
    } else if (processedUrlData.original) {
      router.push(processedUrlData.original);
    }
  };

  return (
    <tr
      key={properties.item.displayId}
      className={styles.submission}
      onClick={handleClick}
    >
      <td>
        <input
          checked={properties.selected.get(properties.item.displayId)}
          onChange={event => {
            properties.setSelected(
              new Map(
                properties.selected.set(
                  properties.item.displayId,
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
        <code>{properties.item.name}</code>
      </td>
      <td>{properties.item.type}</td>
      <td>{properties.item.version}</td>
    </tr>
  );
}
