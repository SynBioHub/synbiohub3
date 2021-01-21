import { useEffect, useState } from "react";
import styles from "../../styles/resulttable.module.css"
import ResultRow from "./ResultRow";

export default function ResultTable(props) {
   var checklist = new Map();
   props.data.forEach(row => checklist.set(row.displayId, false));
   const [selected, setSelected] = useState(checklist);
   const [selectAll, setSelectAll] = useState(false);
   useEffect(() => {
      for (const checked of selected.values()) {
         if (!checked) {
            setSelectAll(false);
            return;
         }
      }
      setSelectAll(true);
   }, [selected]);
   const rows = props.data.map((row) => {
      return <ResultRow selected={selected} setSelected={setSelected}
      name={row.name} displayId={row.displayId} description={row.description}
      type={row.type} version={row.version} key={row.displayId} />
   });
   return (
      <div className={styles.tablecontainer}>
         <table className={styles.table} id={styles.results}>
            <thead>
               <tr>
                  <th>
                     <input type="checkbox" checked={selectAll} onChange={(e) => {
                        if (e.target.checked) {
                           checklist = new Map();
                           props.data.forEach(row => checklist.set(row.displayId, true));
                           setSelected(checklist);
                           setSelectAll(true);
                        }
                        else {
                           checklist = new Map();
                           props.data.forEach(row => checklist.set(row.displayId, false));
                           setSelected(checklist);
                           setSelectAll(false);
                        }
                     }} />
                  </th>
                  <th>Name</th>
                  <th>Display ID</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Version</th>
               </tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
         </table>
      </div>
   );
}