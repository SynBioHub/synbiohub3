import { faHatWizard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useState } from 'react';

import Options from '../components/SearchComponents/AdvancedSearch/Options';
import SearchHeader from '../components/SearchComponents/SearchHeader/SearchHeader';
import TopLevel from '../components/TopLevel';
import styles from '../styles/advancedsearch.module.css';

export default function AdvancedSearch() {
  const [creator, setCreator] = useState('');
  const [created, setCreated] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);
  const [modifed, setModified] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [role, setRole] = useState('');
  const [collections, setCollections] = useState([]);

  const router = useRouter();

  const constructSearch = () => {
    router.push('/search');
  };

  return (
    <TopLevel doNotTrack={true} hideFooter={true} publicPage={true}>
      <div className={styles.container}>
        <SearchHeader selected="Advanced Search" />
        <div className={styles.standardcontainer}>
          <div className={styles.body}>
            <Options
              creator={creator}
              setCreator={setCreator}
              type={type}
              setType={setType}
              role={role}
              setRole={setRole}
              keyword={keyword}
              setKeyword={setKeyword}
              created={created}
              setCreated={setCreated}
              modified={modifed}
              setModified={setModified}
              setCollections={setCollections}
              collections={collections}
            />

            <div
              className={styles.searchbutton}
              role="button"
              onClick={() => {
                constructSearch();
              }}
            >
              <FontAwesomeIcon
                icon={faHatWizard}
                size="1x"
                className={styles.dnaicon}
                color="#F2E86D"
              />
              <div>Search</div>
            </div>
          </div>
        </div>
      </div>
    </TopLevel>
  );
}
