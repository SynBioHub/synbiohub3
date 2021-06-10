import { faGlobeAmericas, faUserLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import router from 'next/router';

/**
 * This component renders a single result row in the result table in standard search
 */
export default function ResultRow(properties) {
  let type = '';
  const potentialType = properties.type.toLowerCase();

  // Identify what type of object the search result is from type url
  if (potentialType.includes('component')) {
    type = 'Component';
  }
  if (potentialType.includes('sequence')) {
    type = 'Sequence';
  }
  if (potentialType.includes('module')) {
    type = 'Module';
  }
  if (potentialType.includes('collection')) {
    type = 'Collection';
  }

  let privacy = (
    <FontAwesomeIcon icon={faGlobeAmericas} color="#000000" size="1x" />
  );
  if (!properties.uri.includes('/public/'))
    privacy = <FontAwesomeIcon icon={faUserLock} color="#ff0000" size="1x" />;

  return (
    <tr
      onClick={() => {
        router.push(
          properties.uri.replace(
            'https://synbiohub.org',
            process.env.backendUrl
          )
        );
      }}
    >
      <td>
        <input
          checked={properties.selected.get(properties.displayId)}
          onChange={event => {
            properties.setSelected(
              new Map(
                properties.selected.set(
                  properties.displayId,
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

      <td>{properties.name}</td>

      <td>{properties.displayId}</td>

      <td>{properties.description}</td>

      <td>{type}</td>

      <td>{privacy}</td>
    </tr>
  );
}
