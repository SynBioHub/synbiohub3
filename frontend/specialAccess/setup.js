import TopLevel from '../components/TopLevel';
import Image from 'next/image';
import styles from '../styles/setup.module.css';
import InputField from '../components/Submit/ReusableComponents/InputField';
import { SketchPicker } from 'react-color';
import { useState } from 'react';
import SubmitLabel from '../components/Submit/ReusableComponents/SubmitLabel';

import getConfig from 'next/config';
import { useDispatch } from 'react-redux';
import { addError } from '../redux/actions';
import axios from 'axios';
const { publicRuntimeConfig } = getConfig();

export default function Setup({ setInSetupMode }) {
  const dispatch = useDispatch();
  const [instanceName, setInstanceName] = useState('');
  const [color, setColor] = useState('#D25627');
  const [frontPageText, setFrontPageText] = useState(
    `<a href="/About">SynBioHub</a> is a <i>design repository</i> for people designing biological constructs. It enables DNA and protein designs to be uploaded, then provides a shareable link to allow others to view them. SynBioHub also facilitates searching for information about existing useful parts and designs by combining data from a variety of sources.`
  );
  const [logo, setLogo] = useState(undefined);
  const [allowPublicSignup, setAllowPublicSignup] = useState(true);

  const [frontendURL, setFrontendURL] = useState('http://localhost:3333/');
  const [backendURL, setBackendURL] = useState('http://localhost:7777/');
  const [uriPrefix, setUriPrefix] = useState('http://localhost:7777/');

  const [userName, setUserName] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('');

  const [errors, setErrors] = useState([]);

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
          <div className={styles.titletext}>Welcome to SynBioHub!</div>
        </div>
        <div className={styles.titlesubtext}>
          We just need a few more details to configure your SynBioHub instance
        </div>
        <SetupBlock
          title="1. Brand Your SynBioHub"
          content={
            <div>
              <InputField
                labelText="Instance Name (try to choose something descriptive to identify the kind of parts your SynBioHub instance will store)"
                placeholder="My SynBioHub"
                value={instanceName}
                onChange={event => setInstanceName(event.target.value)}
                inputName="Instance Name"
                containerStyling={styles.inputcontainer}
              />
              <div className={styles.compressor}>
                <div>
                  <SubmitLabel text="Instance Primary Color" />
                  <SketchPicker
                    color={color}
                    onChange={color => setColor(color.hex)}
                    className={styles.colorpicker}
                  />
                </div>
                <div className={styles.notrequired}>
                  <InputField
                    labelText="Homepage Welcome Message"
                    placeholder="Write welcome message here..."
                    inputName="Welcome Message"
                    containerStyling={styles.inputcontainer}
                    value={frontPageText}
                    onChange={event => setFrontPageText(event.target.value)}
                    customInput="textarea"
                  />

                  <InputField
                    labelText="Instance Logo (SVG or high resolution PNG)"
                    inputName="Upload Photo"
                    containerStyling={styles.inputcontainer}
                    customType="file"
                    value={logo}
                    onChange={event => setLogo(event.target.value)}
                  />

                  <InputField
                    labelText="Allow Public Account Creation"
                    inputName="Allow Public"
                    containerStyling={styles.checkboxinput}
                    customType="checkbox"
                    value={allowPublicSignup}
                    onChange={event =>
                      setAllowPublicSignup(event.target.checked)
                    }
                  />
                </div>
              </div>
            </div>
          }
        />
        <SetupBlock
          title="2. Some Technical Details"
          content={
            <div>
              <InputField
                labelText="Frontend URL: We need to know where this SynBioHub instance is is displayed. If the URL below is incorrect, please change it"
                placeholder="Frontend URL"
                value={frontendURL}
                onChange={event => setFrontendURL(event.target.value)}
                inputName="Frontend URL"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="Backend URL: We need to know where this SynBioHub instance is hosted so we can assign URLs to your submissions. In most cases, this will be the same as the frontend. If the URL below is incorrect, please change it"
                placeholder="Backend URL"
                value={backendURL}
                onChange={event => setBackendURL(event.target.value)}
                inputName="Backend URL"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="URI Prefix: We need to know how to prefix URIs of objects stored in this SynBioHub. Its default is the same as the URL, and should only be changed if you are shadowing another instance."
                placeholder="URI Prefix"
                value={uriPrefix}
                onChange={event => setUriPrefix(event.target.value)}
                inputName="URI Prefix"
                containerStyling={styles.inputcontainer}
              />
            </div>
          }
        />
        <SetupBlock
          title="3. Create First Account (Administrator Account)"
          content={
            <div>
              <InputField
                labelText="Username"
                placeholder="john"
                value={userName}
                onChange={event => setUserName(event.target.value)}
                inputName="username"
                containerStyling={styles.inputcontainer}
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
              />

              <InputField
                labelText="Affiliation"
                placeholder="Affiliation (Optional)"
                value={affiliation}
                onChange={event => setAffiliation(event.target.value)}
                inputName="affiliation"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="Email"
                placeholder="johndoe@example.com"
                value={userEmail}
                onChange={event => setUserEmail(event.target.value)}
                inputName="email"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="Password"
                placeholder=""
                value={userPassword}
                onChange={event => setUserPassword(event.target.value)}
                inputName="password"
                containerStyling={styles.inputcontainer}
                customType="password"
              />

              <InputField
                labelText="Password (again)"
                placeholder=""
                value={userPasswordConfirm}
                onChange={event => setUserPasswordConfirm(event.target.value)}
                inputName="password (again)"
                containerStyling={styles.inputcontainer}
                customType="password"
              />
            </div>
          }
        />
        <div
          className={styles.createbutton}
          onClick={async () => {
            const headers = {
              'Content-Type': 'application/json',
              Accept: 'text/plain'
            };
            try {
              await axios.post(
                `${publicRuntimeConfig.backend}/setup`,
                {
                  instanceName,
                  frontendURL,
                  backendURL,
                  uriPrefix,
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
                  allowPublicSignup
                },
                {
                  headers
                }
              );
              setErrors([]);
              setInSetupMode(false);
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
              error.fullUrl = `${publicRuntimeConfig.backend}/setup`;
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

function SetupBlock({ title, content }) {
  return (
    <div className={styles.setupcontainer}>
      <div className={styles.setup}>
        <div className={styles.setuptitle}>{title}</div>
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
