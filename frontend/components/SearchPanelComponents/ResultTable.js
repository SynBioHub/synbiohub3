import { useEffect, useState } from "react";
import styles from "../../styles/resulttable.module.css"
import ResultRow from "./ResultRow";
import Image from 'next/image'

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
            <div className={`${styles.tablebutton} ${buttonClass}`}
            onClick={() => {
               addItemsToBasket(selected, props.data, props.basketItems, props.setBasketItems);
            }}>Add to Basket</div>
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
                  <th>
                     <div className={styles.centerheader}>
                     <span className={styles.headertext}>Name</span>
                     <Image 
                     src='/images/updown.svg'
                     alt='view basket'
                     width={20}
                     height={20}/>
                     </div>
                  </th>
                  <th>
                  <div className={styles.centerheader}>
                     <span className={styles.headertext}>Display ID</span>
                     <Image 
                     src='/images/updown.svg'
                     alt='view basket'
                     width={20}
                     height={20}/>
                  </div>
                  </th>
                  <th>
                  <div className={styles.centerheader}>
                     <span className={styles.headertext}>Description</span>
                     <Image 
                     src='/images/updown.svg'
                     alt='view basket'
                     width={20}
                     height={20}/>
                  </div>
                  </th>
                  <th>
                  <div className={styles.centerheader}>
                     <span className={styles.headertext}>Type</span>
                     <Image 
                     src='/images/updown.svg'
                     alt='view basket'
                     width={20}
                     height={20}/>
                  </div>
                  </th>
                  <th>
                  <div className={styles.centerheader}>
                     <span className={styles.headertext}>Version</span>
                     <Image 
                     src='/images/updown.svg'
                     alt='view basket'
                     width={20}
                     height={20}/>
                  </div>
                  </th>
               </tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
         </table>
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