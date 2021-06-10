import { useDispatch } from 'react-redux';

import { addToBasket } from '../../../../redux/actions';
import styles from '../../../../styles/resulttable.module.css';
import Navigation from './Navigation';

export default function TableButtons(properties) {
  const dispatch = useDispatch();
  return (
    <div className={styles.tablebuttons}>
      <div className={styles.actions}>
        <div
          role="button"
          className={`${styles.tablebutton} ${properties.buttonClass}  ${styles.rightspace}`}
          onClick={() => {
            const itemsChecked = [];

            let checklist = new Map();
            for (const result of properties.data) {
              checklist.set(result.displayId, false);
              if (properties.selected.get(result.displayId)) {
                itemsChecked.push({
                  uri: result.uri,
                  name: result.name
                });
              }
            }
            properties.setSelected(checklist);
            dispatch(addToBasket(itemsChecked));
          }}
        >
          Add to Basket
        </div>

        <div
          className={`${styles.tablebutton} ${properties.buttonClass} ${styles.rightspace}`}
        >
          Download
        </div>
      </div>

      <Navigation count={properties.count} />
    </div>
  );
}
