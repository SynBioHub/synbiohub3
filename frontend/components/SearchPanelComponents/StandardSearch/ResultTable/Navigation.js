import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOffset } from "../../../../redux/actions";
import styles from "../../../../styles/resulttable.module.css"

export default function Navigation(props) {
   const [prev, setPrev] = useState(styles.disabled);
   const [next, setNext] = useState(styles.disabled);
   const offset = useSelector(state => state.search.offset);
   const dispatch = useDispatch();
   useEffect(() => {
      if (offset - props.length >= 0)
         setPrev(styles.enabled);
      else
         setPrev(styles.disabled);

      if (offset + props.length < props.count)
         setNext(styles.enabled);
      else
         setNext(styles.disabled);

   }, [offset, props.count])
   return (
      <div className={styles.navigation}>
         <div className={`${styles.tablebutton} ${prev}`} onClick={() => {
            if (prev !== styles.disabled)
               dispatch(setOffset(offset - props.length));
         }}>«</div>
         <div className={styles.count}><span className={styles.range}>{offset + 1}-{offset + props.length}</span> of {props.count} result(s)</div>
         <div className={`${styles.tablebutton} ${next}`} onClick={() => {
            if (next !== styles.disabled)
               dispatch(setOffset(offset + props.length));
         }}>»</div>
      </div>
   );
}