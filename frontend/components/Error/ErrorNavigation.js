import styles from '../../styles/error.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function ErrorNavigation({ index, length, setIndex }) {
  return (
    <div className={styles.navigationContainer}>
      <NavigateButton
        icon={faArrowLeft}
        direction={-1}
        index={index}
        length={length}
        setIndex={setIndex}
      />
      <NavigateButton
        icon={faArrowRight}
        direction={1}
        index={index}
        length={length}
        setIndex={setIndex}
      />
    </div>
  );
}

function NavigateButton({ icon, index, setIndex, length, direction }) {
  const disabled = index + direction < 0 || index + direction >= length;
  return (
    <div
      className={styles.navigation}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <FontAwesomeIcon
        icon={icon}
        size="1x"
        color={disabled ? '#ccc' : '#000'}
        onClick={() => !disabled && setIndex(index + direction)}
      />
    </div>
  );
}
