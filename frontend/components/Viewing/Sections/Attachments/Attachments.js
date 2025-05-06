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
  const token = useSelector(state => state.user.token);

  // console.log(properties);
  // let uri;
  // if (properties.uri && properties.uri.endsWith('/share')) {
  //   const parts = properties.uri.split('/');
  //   if (parts.length >= 9) {
  //     // Keep everything before the 8th slash (index 8 is 'share', index 7 is hash)
  //     uri = parts.slice(0, 8).join('/');
  //   }
  // }
  // console.log(uri);
  const [refreshMembers, setRefreshMembers] = useState(false);

  const handleSetRefreshMembers = (value) => {
    setRefreshMembers(value);
  };

  useEffect(() => {
    if (owner == undefined) {
      //The attachments in the store should be reset, a new page has been loaded.
      dispatch(setAttachments([]));

      //Gets the owner of the collection.
      getQueryResponse(dispatch, getOwner, { uri: properties.uri }, token).then(
        owner => {
          if (owner.length > 0) setOwner(owner);
          //Handles multiple owners.
          owner.map(res => {
            if (res.ownedBy === graphUri) setIsOwner(true);
          });
          if (properties.uri && properties.uri.endsWith('/share')) {
            setIsOwner(true);
          }
        }
      );

      //Gets the initial attachments and passes them down to the children components.
      getQueryResponse(dispatch, getAttachments, { uri: properties.uri }, token).then(
        attachments => {
          if (attachments.length > 0) {
            dispatch(setAttachments(attachments));
          }
        }
      );
    }
  }, [owner]);

  useEffect(() => {
    if (refreshMembers) {
      // Fetch attachments again and update the state
      getQueryResponse(dispatch, getAttachments, { uri: properties.uri }, token).then(
        attachments => {
          if (attachments.length > 0) {
            dispatch(setAttachments(attachments));
          }
          // Reset refreshMembers to false after refreshing
          setRefreshMembers(false);
        }
      );
      window.location.reload();
    }
  }, [refreshMembers, dispatch, properties.uri]);

  if (!owner) return <Loading />;

  return (
    <AttachmentsTable
      owner={isOwner}
      uri={properties.uri}
      setRefreshMembers={handleSetRefreshMembers}
      headers={['Type', 'Name', 'Size']}
      attachments={attachments}
    />
  );
}
