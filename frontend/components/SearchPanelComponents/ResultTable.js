import { useEffect, useState } from "react";
import styles from "../../styles/resulttable.module.css"
import ResultRow from "./ResultRow";

export default function ResultTable(props) {
   var checklist = new Map();
   props.data.forEach(row => checklist.set(row.displayId, false));
   const [selected, setSelected] = useState(checklist);
   const [selectAll, setSelectAll] = useState(false);
   const [buttonClass, setButtonClass] = useState(styles.disabled);
   useEffect(() => {
      var allSelected = true;
      var oneSelected = false;
      for (const checked of selected.values()) {
         if (!checked)
            allSelected = false;
         else
            oneSelected = true;
      }
      setSelectAll(allSelected);
      if (oneSelected)
         setButtonClass(styles.enabled);
      else
         setButtonClass(styles.disabled);
   }, [selected]);
   const rows = props.data.map((row) => {
      return <ResultRow selected={selected} setSelected={setSelected}
      name={row.name} displayId={row.displayId} description={row.description}
      type={row.type} version={row.version} key={row.displayId} />
   });
   return (
      <div className={styles.tablecontainer}>
         <div className={styles.tablebuttons}>
            <div className={`${styles.tablebutton} ${styles.enabled}`}>Edit Columns</div>
            <div className={`${styles.tablebutton} ${buttonClass}`}>Add to Basket</div>
            <div className={`${styles.tablebutton} ${buttonClass}`}>Download</div>
         </div>
         <table className={styles.table} id={styles.results}>
            <thead>
               <tr>
                  <th>
                     <input type="checkbox" checked={selectAll} onChange={(e) => {
                           checklist = new Map();
                           props.data.forEach(row => checklist.set(row.displayId, e.target.checked));
                           setSelected(checklist);
                           setSelectAll(e.target.checked);
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