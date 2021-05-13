import router from 'next/router';

export default function ResultRow(props) {
  let type = '';
  const potentialType = props.type.toLowerCase();

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
      onClick={() => {
        router.push(props.uri);
      }}
    >
      <td>
        <input
          checked={props.selected.get(props.displayId)}
          onChange={(e) => {
            e.stopPropagation();
            props.setSelected(new Map(props.selected.set(props.displayId, e.target.checked)));
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
