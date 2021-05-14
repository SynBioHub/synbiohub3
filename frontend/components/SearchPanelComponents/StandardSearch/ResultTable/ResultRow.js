import router from 'next/router';

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

      <td>{props.version}</td>
    </tr>
  );
}
