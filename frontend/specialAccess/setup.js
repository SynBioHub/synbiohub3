import TopLevel from '../components/TopLevel';
import Image from 'next/image';
import styles from '../styles/setup.module.css';
import InputField from '../components/Submit/ReusableComponents/InputField';
import { SketchPicker } from 'react-color';
import { useState, useEffect } from 'react';
import SubmitLabel from '../components/Submit/ReusableComponents/SubmitLabel';
import { logoutUser } from '../redux/actions';

import { useDispatch } from 'react-redux';
import { addError } from '../redux/actions';
import { isValidURI } from '../components/Viewing/Shell';
import axios from 'axios';
import feConfig from '../config.json';

export default function Setup({ setInSetupMode }) {
  const dispatch = useDispatch();
  const [instanceName, setInstanceName] = useState('');
  const [color, setColor] = useState('#D25627');
  const [frontPageText, setFrontPageText] = useState(
    `[SynBioHub](/About) is a *design repository* for people designing biological constructs. It enables DNA and protein designs to be uploaded, then provides a shareable link to allow others to view them. SynBioHub also facilitates searching for information about existing useful parts and designs by combining data from a variety of sources.`
  );
  const [logo, setLogo] = useState('');
  const [allowPublicSignup, setAllowPublicSignup] = useState(true);
  const [requireLogin, setRequireLogin] = useState(false);

  const [advancedMode, setAdvancedMode] = useState(false);
  const [frontendURL, setFrontendURL] = useState(window.location.origin + '/');
  const [instanceUrl, setInstanceUrl] = useState('http://localhost:7777');
  const [uriPrefix, setUriPrefix] = useState(window.location.origin + '/');
  const [pluginPrefix, setPluginPrefix] = useState('');
  const [altHome, setAltHome] = useState('');

  const [userName, setUserName] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('');

  const [errors, setErrors] = useState([]);

  const [primaryTitleStyle, setPrimaryTitleStyle] = useState({ color: color });
  const [secondaryTitleStyle, setSecondaryTitleStyle] = useState({ color: color });

  const altHomePaths = [
    '',
    '/submit',
    '/submissions',
    '/search',
    '/profile',
    '/register',
    '/admin',
    '/login',
  ]

  useEffect(() => {
    setPrimaryTitleStyle({ color: color });
    setSecondaryTitleStyle({ color: reduceBrightness(color, 0.25) });
  }, [color]);

  // change the url to the base url
  useEffect(() => {
    window.history.pushState({}, '', '/setup');
  });

  return (
    <TopLevel doNotTrack={true} navbar={<div></div>} publicPage={true}>
      <div className={styles.container}>
        <div className={styles.title}>
          <Image
            alt="logo"
            width={150}
            height={100}
            src="/images/logo_secondary.svg"
          />
          <div className={styles.titletext} style={primaryTitleStyle}>Welcome to SynBioHub!</div>
        </div>
        <div className={styles.titlesubtext}>
          We just need a few more details to configure your SynBioHub instance
        </div>
        <SetupBlock
          title="1. Brand Your SynBioHub"
          style={primaryTitleStyle}
          content={
            <div>
              <InputField
                labelText="Instance Name (try to choose something descriptive to identify the kind of parts your SynBioHub instance will store)"
                placeholder="My SynBioHub"
                value={instanceName}
                onChange={event => setInstanceName(event.target.value)}
                inputName="Instance Name"
                containerStyling={styles.inputcontainer}
                style={secondaryTitleStyle}
              />
              <div className={styles.compressor}>
                <div>
                  <SubmitLabel text="Instance Primary Color"
                    style={secondaryTitleStyle}
                  />
                  <SketchPicker
                    color={color}
                    onChange={color => setColor(color.hex)}
                    className={styles.colorpicker}
                  />
                </div>
                <div className={styles.notrequired}>
                  <InputField
                    labelText="Homepage Welcome Message (Markdown Supported)"
                    labelLink="https://www.markdownguide.org/basic-syntax/"
                    placeholder="Write welcome message here..."
                    inputName="Welcome Message"
                    containerStyling={styles.inputcontainer}
                    value={frontPageText}
                    onChange={event => setFrontPageText(event.target.value)}
                    customInput="textarea"
                    style={secondaryTitleStyle}
                  />

                  <InputField
                    labelText="Instance Logo (SVG or high resolution PNG)"
                    inputName="Upload Photo"
                    containerStyling={styles.inputcontainer}
                    customType="file"
                    style={secondaryTitleStyle}
                    value={logo}
                    onChange={event => {
                      // console.log(event.target.value);
                      setLogo(event.target.value);
                    }}
                  />

                  <InputField
                    labelText="Allow Public Account Creation: if unchecked, accounts can only be created through invitation"
                    inputName="Allow Public"
                    containerStyling={styles.checkboxinput}
                    style={secondaryTitleStyle}
                    inputStyle={{ accentColor: color }}
                    customType="checkbox"
                    value={allowPublicSignup}
                    onChange={event =>
                      setAllowPublicSignup(event.target.checked)
                    }
                  />

                  <InputField
                    labelText="Require Login: Require login for all operations"
                    value={requireLogin}
                    onChange={event => setRequireLogin(event.target.checked)}
                    inputName="Alternate Home Page"
                    containerStyling={styles.checkboxinput}
                    style={secondaryTitleStyle}
                    inputStyle={{ accentColor: color }}
                    customType="checkbox"
                  />
                </div>
              </div>
            </div>
          }
        />
        <SetupBlock
          title="2. Some Technical Details"
          style={primaryTitleStyle}
          content={
            <div>

              <InputField
                labelText="Alternate Home Page: If you would like to set your own version of the home page, set the uri here. For example, typing https://mysynbiohub.org would make this the default page, while mysynbiohub would make https://synbiohub.org/mysynbiohub the default page."
                placeholder="Alternate Home Page"
                customInput="select"
                options={altHomePaths}
                value={altHome}
                onChange={event => {
                  setAltHome(event.target.value);
                  // console.log(event.target.value);
                }}
                inputName="Alternate Home Page"
                containerStyling={styles.inputcontainer}
                style={secondaryTitleStyle}
              />

              <button
                className={styles.advancedbutton}
                onClick={
                  () => {
                    if (advancedMode) {
                      setAdvancedMode(false);
                      return;
                    }
                    const userConfirmed = window.confirm("You probably want to leave these settings alone. If they arent right, make sure you are hosting on the domain you intend to use. Are you sure you want to change these settings?");
                    if (userConfirmed) {
                      setAdvancedMode(true);
                    }
                  }
                }>
                {advancedMode ? "Disable" : "Enable"} Advanced Options (Not Recomended)
              </button>
              <InputField
                labelText="Frontend URL: We need to know where this SynBioHub instance is is displayed. If the URL below is incorrect, please change it"
                placeholder="Frontend URL"
                value={frontendURL}
                onChange={event => setFrontendURL(event.target.value)}
                inputName="Frontend URL"
                containerStyling={styles.inputcontainer}
                disabled={!advancedMode}
                style={secondaryTitleStyle}
              />

              <InputField
                labelText="Backend URL: We need to know where this SynBioHub instance is hosted so we can assign URLs to your submissions. In most cases, this will be the same as the frontend. If the URL below is incorrect, please change it"
                placeholder="Backend URL"
                value={instanceUrl}
                onChange={event => setInstanceUrl(event.target.value)}
                inputName="Backend URL"
                containerStyling={styles.inputcontainer}
                disabled={!advancedMode}
                style={secondaryTitleStyle}
              />

              <InputField
                labelText="URI Prefix: We need to know how to prefix URIs of objects stored in this SynBioHub. Its default is the same as the URL, and should only be changed if you are shadowing another instance."
                placeholder="URI Prefix"
                value={uriPrefix}
                onChange={event => setUriPrefix(event.target.value)}
                inputName="URI Prefix"
                containerStyling={styles.inputcontainer}
                disabled={!advancedMode}
                style={secondaryTitleStyle}
              />

              <InputField
                labelText="Plugin Prefix: If you are running SynBioHub on Docker, this will be the prefix that will tell SynBioHub where the plugin is located."
                placeholder="Plugin Prefix"
                value={pluginPrefix}
                onChange={event => setPluginPrefix(event.target.value)}
                inputName="Plugin Prefix"
                containerStyling={styles.inputcontainer}
                disabled={!advancedMode}
                style={secondaryTitleStyle}
              />

            </div>
          }
        />
        <SetupBlock
          title="3. Create First Account (Administrator Account)"
          style={primaryTitleStyle}
          content={
            <div>
              <InputField
                labelText="Username"
                placeholder="john"
                value={userName}
                onChange={event => setUserName(event.target.value)}
                inputName="username"
                containerStyling={styles.inputcontainer}
                style={secondaryTitleStyle}
                pattern="^[a-zA-Z0-9\-_\.~]+$"
                title="Usernames can only contain letters, numbers, and the symbols - _ . ~"
              />


              <InputField
                labelText="Full Name"
                placeholder="John Doe"
                value={userFullName}
                onChange={event => setUserFullName(event.target.value)}
                inputName="full name"
                containerStyling={styles.inputcontainer}
                style={secondaryTitleStyle}
              />

              <InputField
                labelText="Affiliation"
                placeholder="Affiliation (Optional)"
                value={affiliation}
                onChange={event => setAffiliation(event.target.value)}
                inputName="affiliation"
                containerStyling={styles.inputcontainer}
                style={secondaryTitleStyle}
              />

              <InputField
                labelText="Email"
                placeholder="johndoe@example.com"
                value={userEmail}
                onChange={event => setUserEmail(event.target.value)}
                inputName="email"
                containerStyling={styles.inputcontainer}
                style={secondaryTitleStyle}
              />

              <InputField
                labelText="Password"
                placeholder=""
                value={userPassword}
                onChange={event => setUserPassword(event.target.value)}
                inputName="password"
                containerStyling={styles.inputcontainer}
                customType="password"
                style={secondaryTitleStyle}
              />

              <InputField
                labelText="Password (again)"
                placeholder=""
                value={userPasswordConfirm}
                onChange={event => setUserPasswordConfirm(event.target.value)}
                inputName="password (again)"
                containerStyling={styles.inputcontainer}
                customType="password"
                style={secondaryTitleStyle}
              />
            </div>
          }
        />
        <div
          className={styles.createbutton}
          style={{ backgroundColor: color }}
          onClick={async () => {
            const headers = {
              'Content-Type': 'application/json',
              Accept: 'text/plain'
            };
            // if (altHome !== '' && !isValidURI(altHome)) {
            //   setErrors(['Alternate Home Page must either be empty or contain a valid URL.']);
            //   return; // Prevent the submission
            // }
            /** Move logo file into public folder */
            try {
              await axios.post(
                `${feConfig.backend}/setup`,
                {
                  instanceName,
                  frontendURL,
                  instanceUrl,
                  uriPrefix,
                  pluginPrefix,
                  userName,
                  affiliation,
                  userFullName,
                  userEmail,
                  color,
                  userPassword,
                  userPasswordConfirm,
                  frontPageText,
                  virtuosoINI: '/etc/virtuoso-opensource-7/virtuoso.ini',
                  virtuosoDB: '/var/lib/virtuoso-opensource-7/db',
                  allowPublicSignup,
                  altHome,
                  requireLogin
                },
                {
                  headers
                }
              );
              setErrors([]);
              setInSetupMode(false);
              dispatch(logoutUser());
            } catch (error) {
              if (error.response.status === 400) {
                const errorMessages = error.response.data.details.map(
                  error => error.message
                );
                setErrors(errorMessages);
                return;
              }
              error.customMessage =
                'Request and/or processing failed for POST /setup';
              error.fullUrl = `${feConfig.backend}/setup`;
              dispatch(addError(error));
            }
          }}
        >
          Create My SynBioHub!
        </div>
        <ErrorMessages errors={errors} />
      </div>
    </TopLevel>
  );
}

function SetupBlock({ title, content, style }) {
  return (
    <div className={styles.setupcontainer}>
      <div className={styles.setup}>
        <div className={styles.setuptitle} style={style}>{title}</div>
        {content}
      </div>
    </div>
  );
}

function ErrorMessages({ errors }) {
  if (errors.length == 0) return null;
  const renderedErrors = errors.map((error, index) => (
    <div
      key={index}
      style={{ color: 'red', padding: '0.25rem 0', fontSize: '1.1rem' }}
    >
      {error}
    </div>
  ));
  return <div style={{ paddingBottom: '2rem' }}>{renderedErrors}</div>;
}

function reduceBrightness(hexColor, percentage) {
  // Remove the hash at the start if it's there
  hexColor = hexColor.replace(/^#/, '');

  // Parse the r, g, b values
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);

  // Reduce each component by the percentage
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percentage))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percentage))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percentage))));

  // Convert back to hex and pad with zeros if necessary
  const newHexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

  return newHexColor;
}
