import { useEffect, useState } from 'react';

import styles from '../../../../styles/resulttable.module.css';
import ResultRow from './ResultRow';
import ResultTableHeader from './ResultTableHeader';
import TableButtons from './TableButtons';

/**
 * This component renders the result table displayed in standard search. Uses an 'excel-like' table
 * format
 */
export default function ResultTable(properties) {
  let checklist = new Map();

  for (const row of properties.data) checklist.set(row.displayId, false);
  const [selected, setSelected] = useState(checklist);
  const [selectAll, setSelectAll] = useState(false);
  const [buttonClass, setButtonClass] = useState(styles.disabled);

  useEffect(() => {
    let allSelected = true;
    let oneSelected = false;

    for (const checked of selected.values()) {
      if (!checked) {
        allSelected = false;
      } else {
        oneSelected = true;
      }
    }
    setSelectAll(allSelected);
    if (oneSelected) {
      setButtonClass(styles.enabled);
    } else {
      setButtonClass(styles.disabled);
    }
  }, [selected]);

  const rows = properties.data.map(row => (
    <ResultRow
      selected={selected}
      setSelected={setSelected}
      name={row.name}
      displayId={row.displayId}
      description={row.description}
      type={properties.overrideType ? properties.overrideType : row.type}
      version={row.version}
      uri={row.uri}
      key={row.uri}
    />
  ));

  return (
    <div className={styles.resultcontainer}>
      <TableButtons
        buttonClass={buttonClass}
        selected={selected}
        setSelected={setSelected}
        data={properties.data}
        count={properties.count}
        submissionsPage={properties.submissionsPage}
      />

      <div className={styles.tablecontainer}>
        <table className={styles.table} id={styles.results}>
          <thead>
            <tr>
              <th>
                <input
                  checked={selectAll}
                  onChange={event => {
                    checklist = new Map();
                    for (const row of properties.data)
                      checklist.set(row.displayId, event.target.checked);
                    setSelected(checklist);
                    setSelectAll(event.target.checked);
                  }}
                  type="checkbox"
                />
              </th>

              <ResultTableHeader title="Name" />

              <ResultTableHeader title="Display ID" />

              <ResultTableHeader title="Description" />

              <ResultTableHeader title="Type" />

              <ResultTableHeader title="Privacy" />
            </tr>
          </thead>

          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}
