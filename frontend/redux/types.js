// REDUX ACTION TYPES

/*
This file stores all the 'types', which are used by the reducers (see ./reducers.js)
and actions (see ./actions.js) to update the redux state. These types are stored here,
rather than being typed out twice in actions and reducers, for consistency (reduces typos)
and code reusability.
*/

// USER
export const USERNAME = 'USERNAME';
export const USERTOKEN = 'USERTOKEN';
export const LOGGEDIN = 'LOGGEDIN';
export const LOGINERROR = 'LOGINERROR';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const USERINFO = 'USERINFO';
export const REGISTERERROR = 'REGISTERERROR';

// SEARCH
export const QUERY = 'QUERY';
export const OFFSET = 'OFFSET';
export const LIMIT = 'LIMIT';

// SUBMIT
export const SUBMITRESET = 'SUBMITRESET';
export const SUBMITTING = 'SUBMITTING';
export const SHOWSUBMITPROGRESS = 'SHOWSUBMITPROGRESS';
export const SELECTEDCOLLECTION = 'SELECTEDCOLLECTION';
export const FILESUPLOADING = 'FILESUPLOADING';
export const FAILEDFILES = 'FAILEDFILES';
export const FILEFAILED = 'FILEFAILED';
export const ATTACHMENTSUPLOADING = 'ATTACHMENTSUPLOADING';
export const CANSUBMITTO = 'CANSUBMITTO';
export const GETTINGCANSUBMITTO = 'GETTINGCANSUBMITTO';
export const TESTFORDOCKER = 'TESTFORDOCKER';
export const PUBLISHING = 'PUBLISHING';

// CREATE COLLECTION
export const PROMPTNEWCOLLECTION = 'PROMPTNEWCOLLECTION';
export const CREATINGCOLLECTION = 'CREATINGCOLLECTION';
export const CREATINGCOLLECTIONERRORS = 'CREATINGCOLLECTIONERRORS';
export const CREATINGCOLLECTIONBUTTONTEXT = 'CREATINGCOLLECTIONBUTTONTEXT';

// BASKET
export const ADDTOBASKET = 'ADDTOBASKET';

// DOWNLOAD
export const SHOWDOWNLOAD = 'SHOWDOWNLOAD';
export const DOWNLOADLIST = 'DOWNLOADLIST';
export const DOWNLOADSTATUS = 'DOWNLOADSTATUS';

// TRACKING
export const TRACKPAGEVISIT = 'TRACKPAGEVISIT';
