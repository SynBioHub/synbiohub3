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

  const dispatch = useDispatch();

  useEffect(() => {
    if (details == undefined) {
      getQueryResponse(dispatch, getDetails, { uri: properties.uri }).then(
        details => {
          if (details && details.length > 0) setDetails(details[0]);
        }
      );

      //Gets the owner of the collection to see if the current user should be able to modify the details.
      getQueryResponse(dispatch, getOwner, { uri: properties.uri }).then(
        owner => {
          owner.map(res => {
            if (res.ownedBy === user.graphUri) setIsOwner(true);
          });
        }
      );

      //Citations has to be queried individually so everything can be formatted easier.
      getQueryResponse(dispatch, getCitations, { uri: properties.uri }).then(
        citations => {
          if (citations.length > 0) {
            //Formats the result so it can be joined.
            const results = [];
            citations.forEach(res => {
              results.push(res.citation);
            });

            //Get the citation info and parse it.
            getCitationInfo(results.join(', ')).then(parsedCitations => {
              if (parsedCitations !== undefined) {
                const list = [];
                parsedCitations.forEach(citation => {
                  list.push(citation);
                });

                //Joins the list with line breaks so html-react-parser renders line breaks between citations.
                setReferences(list.join('<br><br>'));
              }
            });
          }
        }
      );
    }
  }, [details]);

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
