import { useDispatch } from 'react-redux';

import { getCanSubmitTo } from '../../../redux/actions';
import styles from '../../../styles/choosecollection.module.css';
import MajorLabel from '../MajorLabel';
import SelectDestination from './SelectDestination';

export default function ChooseCollection() {
  const dispatch = useDispatch();
  dispatch(getCanSubmitTo());
  return (
    <div>
      <MajorLabel
        text="Select Destination Collection"
        link="https://wiki.synbiohub.org/userdocumentation/managingsubmitting/"
      />
      <div className={styles.collectionoptionscontainer}>
        <SelectDestination />
      </div>
    </div>
  );
}
