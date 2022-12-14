/* eslint sonarjs/cognitive-complexity: "off" */
import { useEffect, useState } from 'react';

import styles from '../../../styles/defaulttable.module.css';
import Loading from '../Loading';
import { numberDisplayOptions } from './TableConfig';
import TableNav from './TableNav';
import SimpleTableHeader from './SimpleTableHeader';
import axios from 'axios';

export default function SimpleTable(properties) {
  const [display, setDisplay] = useState([]);
  const [numberEntries, setNumberEntries] = useState(
    properties.hideFooter
      ? numberDisplayOptions[numberDisplayOptions.length - 1].value
      : numberDisplayOptions[0].value
  );
  const [offset, setOffset] = useState(0);

  

  useEffect(() => {
    if (properties.data.data) {
      setDisplay(
        createDisplay(
          properties.data.data[0].id,
          properties.data.data[0].name
        )
      );
      document.getElementById('pluginLoginForm').style.display = 'none';
    }
  }, [properties.data]);
  if (properties.loading) return <Loading />;
  else if (properties.data) {
    return (
      <div
        className={`${styles.container} ${
          properties.scrollX ? styles.scrollX : ''
        }`}
      >
        <SimpleTableHeader
          title={properties.title}
          hideCount={properties.hideCount}
          count={properties.count ? properties.count : properties.data.length}
          topStickyIncrement={properties.topStickyIncrement}
        />
        <table className={styles.table}>
          {properties.headers && (
            <thead
              style={{
                top: `${
                  properties.topStickyIncrement
                    ? 2.5 + properties.topStickyIncrement
                    : 2.5
                }rem`
              }}
            >
              <tr>{header}</tr>
            </thead>
          )}
          <tbody>
            <tr>
              <td>ID</td><td>Name</td><td>Login</td>
            </tr>
            <tr>
              <td>{display[0]}</td><td>{display[1]}</td><td><button onClick={() => {
                if (document.getElementById('loginbutton').innerText == 'Login') {
                  openLoginForm();
                } else if (document.getElementById('loginbutton').innerText == 'Logout') {
                  logoutForm();
                }}}
                id="loginbutton">Login</button></td>
            </tr>
          </tbody>
        </table>
        <div id="pluginLoginForm">
                <form>
                  <h1>Login</h1>
                  <label><b>Username</b></label>
                  <input type="text" placeholder="Enter Username" id='usernamebox' name='username'></input>
                  <label><b>Password</b></label>
                  <input type="password" placeholder="Enter Password" id='passwordbox' name='password'></input>
                  <button type="submit" onClick={() => {loginForm(document.getElementById('usernamebox').value, document.getElementById('passwordbox').value);}}>Login</button>
                  <button type="button" onClick={() => {closeForm();}}>Close</button>
                </form>
              </div>
        {!properties.hideFooter && (
          <TableNav
            title={properties.title}
            offset={offset}
            setOffset={setOffset}
            numberEntries={numberEntries}
            setNumberEntries={setNumberEntries}
            numberShownLabel={properties.numberShownLabel}
          />
        )}
      </div>
    );
  } else {
    return <ErrorMessage title={properties.title} />;
  }
}

function createDisplay(id, name) {
  return (
    [id, name]
  )
}

function ErrorMessage(properties) {
  return (
    <div className={styles.error}>
      Errors were encountered while fetching <code>{properties.title}</code>
    </div>
  );
}

function openLoginForm() {
  var temp = document.getElementById("pluginLoginForm");
  if (temp) {
    document.getElementById("pluginLoginForm").style.display = "block";
  } else {
    console.log("Not created yet.");
  }
  
}

function closeForm() {
  var temp = document.getElementById("pluginLoginForm");
  if (temp) {
    document.getElementById("pluginLoginForm").style.display = "none";
  } else {
    console.log("Not created yet.");
  }
  document.getElementById('usernamebox').value="";
  document.getElementById('passwordbox').value="";
}

function loginForm(username, password) {
  event.preventDefault();
  return axios({
    method: 'post',
    url: "http://localhost:6789/" + "plugin/token",
    headers: {}, 
    data: {
      "username": username,
      "email": "user@gmail.com",
      "password": password,
      "server": "testserver",
      "action": "login",
      "loginToken": "",
      "refreshToken": ""
    }
  }).then(response => {
    JSON.parse(JSON.stringify(response.data), (key, value) => {
      setCookie(key, value, 300);
    })
    closeForm();
    document.getElementById('loginbutton').innerText = 'Logout';
    return response.data;
  })
    
}

function logoutForm() {
  deleteCookie('login_token', '/', 'localhost');
  deleteCookie('refresh_token', '/', 'localhost');
  document.getElementById('loginbutton').innerText = 'Login';
  return;
}

function setCookie(cname, cvalue, seconds) {
  const d = new Date();
  d.setTime(d.getTime() + (seconds*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(name){
  return document.cookie.split(';').some(c => {
      return c.trim().startsWith(name + '=');
  });
}

function deleteCookie( name, path, domain ) {
  if( getCookie( name ) ) {
    document.cookie = name + "=" +
      ((path) ? ";path="+path:"")+
      ((domain)?";domain="+domain:"") +
      ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
  }
}
