import router from 'next/router';
import Image from 'next/image';

/**
 * This component renders a single result row in the result table in standard search
 */
export default function ResultRow(props) {
  let type = '';
  const potentialType = props.type.toLowerCase();

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

  let privacy = 
  <Image
    alt="unlocked (privacy)"
    height={18}
    src="/images/public_lock.svg"
    width={18}
  />;
  if (props.uri.indexOf('/public/') === -1)
    privacy =
    <Image
      alt="locked (privacy)"
      height={17}
      src="/images/private_lock.svg"
      width={17}
    />;

  return (
    <tr
      onClick={(e) => {
        router.push(props.uri);
      }}
    >
      <td>
        <input
          checked={props.selected.get(props.displayId)}
          onChange={(e) => {
            props.setSelected(new Map(props.selected.set(props.displayId, e.target.checked)));
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          type="checkbox"
        />
      </td>

      <td>{props.name}</td>

      <td>{props.displayId}</td>

      <td>{props.description}</td>

      <td>{type}</td>

      <td>{privacy}</td>
    </tr>
  );
}
