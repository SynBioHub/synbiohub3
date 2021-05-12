import { useEffect, useState } from "react";
import styles from "../../../../styles/resulttable.module.css"

export default function Navigation(props) {
   const [prev, setPrev] = useState(styles.disabled);
   const [next, setNext] = useState(styles.disabled);
   useEffect(() => {
      if (props.offset - props.length >= 0)
         setPrev(styles.enabled);
      else
         setPrev(styles.disabled);

      if (props.offset + props.length < props.count)
         setNext(styles.enabled);
      else
         setNext(styles.disabled);

   }, [props.offset, props.count])
   return (
      <div className={styles.navigation}>
         <div className={`${styles.tablebutton} ${prev}`} onClick={() => {
            if (prev !== styles.disabled)
               props.setOffset(props.offset - props.length);
         }}>«</div>
         <div className={styles.count}><span className={styles.range}>{props.offset + 1}-{props.offset + props.length}</span> of {props.count} result(s)</div>
         <div className={`${styles.tablebutton} ${next}`} onClick={() => {
            if (next !== styles.disabled)
               props.setOffset(props.offset + props.length);
         }}>»</div>
      </div>
   );
}