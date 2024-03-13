import { useDispatch } from 'react-redux';
import styles from '../../styles/error.module.css';
import { useRouter } from 'next/router';
import { clearErrors, removeErrorByIndex, logoutUser } from '../../redux/actions';

export default function ErrorClearer({ index, setIndex, size }) {
  const dispatch = useDispatch();
  const router = useRouter();
  if (size === 'relog') {
    return (
      <div
        className={styles.clearButton}
        onClick={() => {
          dispatch(clearErrors());
          dispatch(logoutUser());
          router.push('/');
        }}
      >
        Return to Login
      </div>
    );
  }
  if (size === 'small') {
    return (
      <div
        className={styles.clearButton}
        onClick={() => {
          dispatch(removeErrorByIndex(index));
          if (index > 0) {
            setIndex(index - 1);
          }
        }}
      >
        Dismiss
      </div>
    );
  }
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
