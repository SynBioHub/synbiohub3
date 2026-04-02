import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import getDetails from '../../../../sparql/getDetails';
import getOwner from '../../../../sparql/getOwner';
import getCitations from '../../../../sparql/getCitations';
import getQueryResponse from '../../../../sparql/tools/getQueryResponse';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import styles from '../../../../styles/view.module.css';

import Loading from '../../../Reusable/Loading';
import EditSection from './EditSection';
import { getCitationInfo } from './EditSection';
import Section from './Section';

export default function Details(properties) {
  const [details, setDetails] = useState();
  const [references, setReferences] = useState();
  const [showEdit, setShowEdit] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const user = useSelector(state => state.user);
  const token = useSelector(state => state.user.token);

  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true; // ✅ flag to prevent state updates on unmounted component
  
    if (!properties.uri) return;
  
    getQueryResponse(dispatch, getDetails, { uri: properties.uri }, token).then(details => {
      if (isMounted && details?.length > 0) {
        setDetails(details[0]);
      }
    });
  
    getQueryResponse(dispatch, getOwner, { uri: properties.uri }, token).then(owner => {
      if (isMounted && (
        owner?.some(res => res.ownedBy === user.graphUri) ||
        properties.uri.endsWith('/share')
      )) {
        setIsOwner(true);
      }
    });
  
    getQueryResponse(dispatch, getCitations, { uri: properties.uri }, token).then(citations => {
      if (isMounted && citations?.length > 0) {
        const citationIds = citations.map(res => res.citation).join(', ');
  
        getCitationInfo(citationIds).then(parsedCitations => {
          if (isMounted && parsedCitations !== undefined) {
            setReferences(parsedCitations.join('<br><br>'));
          }
        });
      }
    });
  
    // 🧼 Cleanup function
    return () => {
      isMounted = false;
    };
  }, [dispatch, properties.uri, token, user.graphUri]);
  


  if (!details) return <Loading />;

  /**
   * For every details section if there is content then the content is showed.
   * If there is no content and the user is the owner then an add button is rendered.
   * If the user if the owner and has clicked the edit button on one of the details sections
   * then a editing textarea will be shown.
   *
   * @param {String} content The content of the details section.
   * @param {String} title The title of the details section.
   */
  const getDetailsSection = (content, title) => {
    if (showEdit.includes(title)) {
      return (
        <EditSection
          token={user.token}
          uri={properties.uri}
          content={content}
          title={title}
          setShowEdit={setShowEdit}
          setDetails={setDetails}
          setReferences={setReferences}
        />
      );
    } else if (content) {
      return (
        <Section
          owner={isOwner}
          setShowEdit={setShowEdit}
          title={title}
          text={content}
        />
      );
    } else if (isOwner) {
      return (
        <div
          type="button"
          onClick={() => {
            setShowEdit(curr => [...curr, title]);
          }}
        >
          <FontAwesomeIcon
            icon={faPlus}
            size="1x"
            color="#465875"
            className={styles.setdetailsectionplus}
          />
          <h4 className={styles.adddetailsection}>{`Add ${title}`}</h4>
        </div>
      );
    }
  };

  return (
    <div>
      <div>
        {getDetailsSection(details.mutableDescription, 'Description')}
        {getDetailsSection(details.mutableNotes, 'Notes')}
        {getDetailsSection(details.mutableProvenance, 'Source')}
        {getDetailsSection(references, 'References')}
      </div>
    </div>
  );
}
