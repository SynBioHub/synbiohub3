import Image from 'next/image';
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
    <Image
      alt="unlocked (privacy)"
      height={18}
      src="/images/public_lock.svg"
      width={18}
    />
  );
  if (!properties.uri.includes('/public/')) {
    privacy = (
      <Image
        alt="locked (privacy)"
        height={17}
        src="/images/private_lock.svg"
        width={17}
      />
    );
  }

  return (
    <tr
      onClick={e => {
        router.push(properties.uri);
      }}
    >
      <td>
        <input
          checked={properties.selected.get(properties.displayId)}
          onChange={e => {
            properties.setSelected(
              new Map(
                properties.selected.set(properties.displayId, e.target.checked)
              )
            );
          }}
          onClick={e => {
            e.stopPropagation();
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
