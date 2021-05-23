import {
  centerheader,
  headertext
} from '../../../../styles/resulttable.module.css';

/**
 * Header for the Results Table in Standard search. Used to identify table names
 */
export default function ResultTableHeader(properties) {
  return (
    <th>
      <div className={centerheader}>
        <span className={headertext}>{properties.title}</span>
      </div>
    </th>
  );
}
