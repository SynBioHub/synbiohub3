import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import getAttachments from '../../../../sparql/getAttachments';
import getOwner from '../../../../sparql/getOwner';
import getQueryResponse from '../../../../sparql/tools/getQueryResponse';

import AttachmentsTable from './AttachmentsTable';
import Loading from '../../../Reusable/Loading';
import { setAttachments } from '../../../../redux/actions';

/**
 * If the user is the creator of the collection then the upload/lookup attachment section
 * and the garbage icon next to any attachments is shown.
 *
 * @param {Any} properties Information passed down from parent component.
 * @returns The attachments and optional upload/lookup attachment section.
 */
export default function Attachments(properties) {
  //handle hiding table header and resetting attachments on each different page.
  const [owner, setOwner] = useState();
  const [isOwner, setIsOwner] = useState(false);
  const dispatch = useDispatch();
  const graphUri = useSelector(state => state.user.graphUri);
  const attachments = useSelector(state => state.attachments.attachments);

  useEffect(() => {
    if (owner == undefined) {
      //The attachments in the store should be reset, a new page has been loaded.
      dispatch(setAttachments([]));

      //Gets the owner of the collection.
      getQueryResponse(dispatch, getOwner, { uri: properties.uri }).then(
        owner => {
          if (owner.length > 0) setOwner(owner);
          //Handles multiple owners.
          owner.map(res => {
            if (res.ownedBy === graphUri) setIsOwner(true);
          });
        }
      );

      //Gets the initial attachments and passes them down to the children components.
      getQueryResponse(dispatch, getAttachments, { uri: properties.uri }).then(
        attachments => {
          if (attachments.length > 0) {
            dispatch(setAttachments(attachments));
          }
        }
      );
    }
  }, [owner]);

  if (!owner) return <Loading />;

  return (
    <AttachmentsTable
      owner={isOwner}
      uri={properties.uri}
      headers={['Type', 'Name', 'Size']}
      attachments={attachments}
      setRefreshMembers={properties.setRefreshMembers}
    />
  );
}
