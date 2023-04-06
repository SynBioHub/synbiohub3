import { useDispatch } from 'react-redux';
import styles from '../../styles/error.module.css';
import { clearErrors, removeErrorByIndex } from '../../redux/actions';

export default function ErrorClearer({ index, setIndex }) {
  const dispatch = useDispatch();
  return (
    <div className={styles.sideBySide}>
      <div
        className={styles.clearAllButton}
        onClick={() => dispatch(clearErrors())}
      >
        Clear All
      </div>
      <div
        className={styles.clearButton}
        onClick={() => {
          dispatch(removeErrorByIndex(index));
          if (index > 0) {
            setIndex(index - 1);
          }
        }}
      >
        Clear Error
      </div>
    </div>
  );
} // Compare this snippet from components/Error/Error.js:
