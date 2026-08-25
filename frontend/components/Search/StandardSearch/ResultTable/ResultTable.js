import { useEffect, useState } from 'react';

import styles from '../../../../styles/resulttable.module.css';
import Navigation from './Navigation';
import ResultRow from './ResultRow';
import ResultsMeta from './ResultsMeta';
import ResultTableHeader from './ResultTableHeader';
import TableActionsPortal from './TableActionsPortal';
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
    if (selected.size > 0) {
      setSelectAll(allSelected);
    }

    if (oneSelected) {
      setButtonClass(styles.enabled);
    } else {
      setButtonClass(styles.disabled);
    }
  }, [selected]);

  const rows = properties.data.map(row => {
    return (
      <ResultRow
        selected={selected}
        setSelected={setSelected}
        name={row.name}
        displayId={row.displayId}
        description={row.description}
        type={row.derivedType || row.type}
        version={row.version}
        uri={row.uri}
        key={row.uri}
        sbolType={row.sbolType}
        role={row.role}
      />
    );
  });

  if (properties.data.length === 0) {
    return <div className={styles.tablecontainer2}>No results found</div>;
  }
  return (
    <div className={styles.resultcontainer}>
      <TableActionsPortal>
        <TableButtons
          buttonClass={buttonClass}
          selected={selected}
          setSelected={setSelected}
          data={properties.data}
          submissionsPage={properties.submissionsPage}
        />
      </TableActionsPortal>

      <div className={styles.tablemeta}>
        {properties.children}
        <ResultsMeta count={properties.count} />
      </div>

      <table
        className={`${styles.table} ${styles.resultsTable}`}
        id={styles.results}
      >
        <thead>
          <tr>
            <th>
              <input
                className={styles.checkbox}
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

            <ResultTableHeader title="ID / Name" />

            <ResultTableHeader title="Description" />

            <ResultTableHeader title="Type" />

            <ResultTableHeader title="Privacy" />
          </tr>
        </thead>

        <tbody className={properties.isLoading ? styles.tableloading : ''}>
          {rows}
        </tbody>
      </table>

      <Navigation count={properties.count} />
    </div>
  );
}
