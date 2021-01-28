import { useEffect, useState } from "react";
import styles from "../../../styles/resulttable.module.css"
import ResultRow from "./ResultRow";
import ResultTableHeader from "./ResultTableHeader";
import Navigation from "./Navigation";

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
      <div className={styles.resultcontainer}>
         <div className={styles.tablebuttons}>
            <div className={styles.actions}>
               <div className={`${styles.tablebutton} ${styles.enabled} ${styles.rightspace}`}>Edit Columns</div>
               <div className={`${styles.tablebutton} ${buttonClass}  ${styles.rightspace}`}
               onClick={() => {
                  addItemsToBasket(selected, props.data, props.basketItems, props.setBasketItems);
               }}>Add to Basket</div>
               <div className={`${styles.tablebutton} ${buttonClass} ${styles.rightspace}`}>Download</div>
            </div>
            <Navigation offset={props.offset} setOffset={props.setOffset} length={props.data.length} count={props.count} />
         </div>
         <div className={styles.tablecontainer}>
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


const addItemsToBasket = (selected, rows, originalBasket, setBasketItems) => {
   const newBasket = [...originalBasket];
   rows.forEach(row => {
      if (selected.get(row.displayId))
         newBasket.push(row);
   });
   setBasketItems(newBasket);
}