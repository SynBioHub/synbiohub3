/**
 * Header for the Results Table in Standard search. Used to identify table names
 */
export default function ResultTableHeader(properties) {
  return (
    <th>
      <div>
        <span>{properties.title}</span>
      </div>
    </th>
  );
}
