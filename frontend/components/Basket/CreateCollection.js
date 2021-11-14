import {
  faArrowCircleLeft,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';

import { getCanSubmitTo } from '../../redux/actions';
import styles from '../../styles/basket.module.css';
import ChooseCollection from '../Submit/ChooseCollection/ChooseCollection';
import SubmissionStatusPanel from '../Submit/SubmissionStatusPanel';
import SubmitButton from '../Submit/SubmitButton';

export default function CreateCollection(properties) {
  const showSubmitProgress = useSelector(
    state => state.submit.showSubmitProgress
  );

  const promptNewCollection = useSelector(
    state => state.collectionCreate.promptNewCollection
  );

  const dispatch = useDispatch();
  dispatch(getCanSubmitTo());

  return (
    <div>
      {!showSubmitProgress ? (
        <div className={styles.basketcontent}>
          <div
            className={styles.backtobasket}
            role="button"
            onClick={() => {
              properties.setCreateCollectionMode(false);
            }}
          >
            <FontAwesomeIcon
              icon={faArrowCircleLeft}
              size="1x"
              color="#F2E86D"
              className={styles.backtobasketarrow}
            />
            <h4>Back to basket</h4>
          </div>
          <ChooseCollection label="Select Destination Collection" />
          {!promptNewCollection && (
            <div>
              <SubmitButton
                files={properties.itemsToAddToCollection}
                overwriteCollection={false}
                addingToCollection={true}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`${styles.basketcontent} ${styles.basketsubmissionstatus}`}
        >
          <SubmissionStatusPanel />
        </div>
      )}
      <FontAwesomeIcon
        icon={faTimesCircle}
        size="2x"
        color="#D25627"
        spin
        className={styles.basketicon}
        onClick={() => {
          properties.setShowBasket(false);
          properties.setCreateCollectionMode(false);
        }}
      />
    </div>
  );
}
