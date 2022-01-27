import getConfig from 'next/config';
import { useRouter } from 'next/router';

import styles from '../../styles/submissions.module.css';
const { publicRuntimeConfig } = getConfig();

export default function BasketItem(properties) {
  const router = useRouter();

  return (
    <tr
      key={properties.item.displayId}
      className={styles.submission}
      onClick={() => {
        router.push(
          properties.item.uri.replace(
            'https://synbiohub.org',
            publicRuntimeConfig.backend
          )
        );
      }}
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
