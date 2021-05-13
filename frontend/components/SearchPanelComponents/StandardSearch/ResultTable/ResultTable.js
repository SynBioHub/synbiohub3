import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import styles from '../../../../styles/resulttable.module.css';
import ResultRow from './ResultRow';
import ResultTableHeader from './ResultTableHeader';
import Navigation from './Navigation';
import { addToBasket } from '../../../../redux/actions';

export default function ResultTable(props) {
  let checklist = new Map();

  props.data.forEach((row) => checklist.set(row.displayId, false));
  const [
    selected,
    setSelected,
  ] = useState(checklist);
  const [
    selectAll,
    setSelectAll,
  ] = useState(false);
  const [
    buttonClass,
    setButtonClass,
  ] = useState(styles.disabled);
  const dispatch = useDispatch();

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

  const rows = props.data.map((row) => (
    <ResultRow
      selected={selected}
      setSelected={setSelected}
      name={row.name}
      displayId={row.displayId}
      description={row.description}
      type={row.type}
      version={row.version}
      key={row.uri}
    />
  ));

  return (
    <div className={styles.resultcontainer}>
      <div className={styles.tablebuttons}>
        <div className={styles.actions}>
          <div className={`${styles.tablebutton} ${styles.enabled} ${styles.rightspace}`}>Edit Columns</div>

          <div
            className={`${styles.tablebutton} ${buttonClass}  ${styles.rightspace}`}
            onClick={() => {
              const itemsChecked = [];

              checklist = new Map();
              props.data.forEach((result) => {
                checklist.set(result.displayId, false);
                if (selected.get(result.displayId)) {
                  itemsChecked.push({
                    uri: result.uri,
                    name: result.name,
                  });
                }
              });
              setSelected(checklist);
              dispatch(addToBasket(itemsChecked));
            }}
          >
            Add to Basket
          </div>

          <div className={`${styles.tablebutton} ${buttonClass} ${styles.rightspace}`}>Download</div>
        </div>

        <Navigation
          count={props.count}
          length={props.data.length}
        />
      </div>

      <div className={styles.tablecontainer}>
        <table
          className={styles.table}
          id={styles.results}
        >
          <thead>
            <tr>
              <th>
                <input
                  checked={selectAll}
                  onChange={(e) => {
                    checklist = new Map();
                    props.data.forEach((row) => checklist.set(row.displayId, e.target.checked));
                    setSelected(checklist);
                    setSelectAll(e.target.checked);
                  }}
                  type="checkbox"
                />
              </th>

              <ResultTableHeader title="Name" />

              <ResultTableHeader title="Display ID" />

              <ResultTableHeader title="Description" />

              <ResultTableHeader title="Type" />

              <ResultTableHeader title="Version" />
            </tr>
          </thead>

          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    </div>
  );
}
