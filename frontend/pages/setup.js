import TopLevel from '../components/TopLevel';
import Image from 'next/image';
import styles from '../styles/setup.module.css';
import InputField from '../components/Submit/ReusableComponents/InputField';
import { SketchPicker } from 'react-color';
import { useState } from 'react';
import SubmitLabel from '../components/Submit/ReusableComponents/SubmitLabel';

export default function Setup() {
  const [instanceName, setInstanceName] = useState('');
  const [color, setColor] = useState('#D25627');
  const [welcome, setWelcome] = useState(
    `<a href="/About">SynBioHub</a> is a <i>design repository</i> for people designing biological constructs. It enables DNA and protein designs to be uploaded, then provides a shareable link to allow others to view them. SynBioHub also facilitates searching for information about existing useful parts and designs by combining data from a variety of sources.`
  );
  const [logo, setLogo] = useState(undefined);
  const [allowPublic, setAllowPublic] = useState(true);

  const [instanceURL, setInstanceURL] = useState('http://localhost:7777/');
  const [instanceURI, setInstanceURI] = useState('http://localhost:7777/');

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

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
                onChange={event => setInstanceName(event.value)}
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
                    value={welcome}
                    onChange={event => setWelcome(event.value)}
                    customInput="textarea"
                  />

                  <InputField
                    labelText="Instance Logo (SVG or high resolution PNG)"
                    inputName="Upload Photo"
                    containerStyling={styles.inputcontainer}
                    customType="file"
                    value={logo}
                    onChange={event => setLogo(event.value)}
                  />

                  <InputField
                    labelText="Allow Public Account Creation"
                    inputName="Allow Public"
                    containerStyling={styles.checkboxinput}
                    customType="checkbox"
                    value={allowPublic}
                    onChange={event => setAllowPublic(event.checked)}
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
                labelText="Instance URL: We need to know where this SynBioHub instance is hosted so we can assign URLs to your submissions. If the URL below is incorrect, please change it"
                placeholder="Instance URL"
                value={instanceURL}
                onChange={event => setInstanceURL(event.value)}
                inputName="Instance URL"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="URI Prefix: We need to know how to prefix URIs of objects stored in this SynBioHub. Its default is the same as the URL, and should only be changed if you are shadowing another instance."
                placeholder="URI Prefix"
                value={instanceURI}
                onChange={event => setInstanceURI(event.value)}
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
                value={username}
                onChange={event => setUsername(event.value)}
                inputName="username"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={event => setFullName(event.value)}
                inputName="full name"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="Affiliation"
                placeholder="Affiliation (Optional)"
                value={affiliation}
                onChange={event => setAffiliation(event.value)}
                inputName="affiliation"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="Email"
                placeholder="johndoe@example.com"
                value={email}
                onChange={event => setEmail(event.value)}
                inputName="email"
                containerStyling={styles.inputcontainer}
              />

              <InputField
                labelText="Password"
                placeholder=""
                value={password}
                onChange={event => setPassword(event.value)}
                inputName="password"
                containerStyling={styles.inputcontainer}
                customType="password"
              />

              <InputField
                labelText="Password (again)"
                placeholder=""
                value={password2}
                onChange={event => setPassword2(event.value)}
                inputName="password (again)"
                containerStyling={styles.inputcontainer}
                customType="password"
              />
            </div>
          }
        />
        <div className={styles.createbutton}>Create My SynBioHub!</div>
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
