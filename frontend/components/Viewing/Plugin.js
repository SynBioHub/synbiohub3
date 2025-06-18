import axios from 'axios';
import { useEffect, useState } from 'react';
import parse, { domToReact } from 'html-react-parser';
import React from 'react';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import { useSelector, useDispatch } from 'react-redux';

import Section from './Sections/Section';
import { showPluginSection, hidePluginSection } from '../../redux/actions';
import { use } from 'react';

export default function Plugin(properties) {

  const [status, setStatus] = useState(null);
  const [content, setContent] = useState('<div>Loading Data From Plugin...</div>');
  const pageSectionsOrder = useSelector(state => state.pageSections.order);
  const hiddenSections = useSelector(state => state.pageSections.hiddenSections);
  const dispatch = useDispatch();
  const theme = JSON.parse(localStorage.getItem('theme')) || {};
  const pluginsUseLocalCompose = useSelector(state => state.pluginsUseLocalCompose);
  const pluginLocalComposePrefix = useSelector(state => state.pluginLocalComposePrefix);
  if (theme && theme.pluginsUseLocalCompose && theme.pluginLocalComposePrefix) {
    pluginsUseLocalCompose = theme.pluginsUseLocalCompose;
    pluginLocalComposePrefix = theme.pluginLocalComposePrefix;
  }

  const acceptedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'div', 'span', 'br', 'hr', 'pre', 'code', 'blockquote', 'strong', 'em', 'i', 'b', 'u', 's', 'sub', 'sup', 'del', 'ins', 'mark', 'small', 'big', 'abbr', 'cite', 'dfn', 'kbd', 'q', 'samp', 'var', 'time', 'address', 'article', 'aside', 'footer', 'header', 'nav', 'section', 'main', 'figure', 'figcaption', 'details', 'summary', 'dialog', 'menu', 'menuitem', 'menuitem', 'meter', 'progress', 'output', 'canvas', 'audio', 'video', 'iframe', 'object', 'embed', 'param', 'source', 'track', 'map', 'area', 'form', 'label', 'input', 'button', 'select', 'datalist', 'optgroup', 'option', 'textarea', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter', 'details', 'summary', 'command', 'menu', 'menuitem', 'menuitem', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', 'map', 'track', 'source', 'param', 'iframe', 'embed', 'object', 'canvas', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', 'map', 'track', 'source', 'param', 'iframe', 'embed', 'object', 'canvas', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', ]

  let uri = properties.uri;

  let type;

  switch(properties.type) {
    case 'Component':
      type = 'ComponentInstance'
      break
    case 'Module':
      type = 'ModuleInstance'
      break
    case 'ComponentDefinition':
      type = 'Component'
      break
    case 'ModuleDefinition':
      type = 'Module'
      break
    default:
      type = properties.type
  }

  

  useEffect(() => {
    
      evaluatePlugin(properties.plugin, properties.type, pluginsUseLocalCompose, pluginLocalComposePrefix).then(responseStatus => {
        setStatus(responseStatus)

        if(responseStatus) {
          dispatch(showPluginSection(properties.plugin.name)); // To unhide
          const downloadContent = async () => {
            if(!uri.includes('/public/')) {
              const shareLink = await getShareLink(uri.split(theme.uriPrefix).join(''));
              uri = shareLink;
              //Replace backend with uriPrefix
              uri = uri.replace(publicRuntimeConfig.backend, theme.uriPrefix);
            }

            let uriSuffix = uri.split(theme.uriPrefix).join('');
            //Remove first slash if it exists
            if (uriSuffix.startsWith('/')) {
              uriSuffix = uriSuffix.slice(1);
            }

            const pluginData = {
              uriSuffix: uriSuffix,
              instanceUrl: `${publicRuntimeConfig.backend}/`,
              size: 1,
              type: type,
              top: properties.uri,
              apiToken: localStorage.getItem('userToken')
            };

            const renderResponse = await runPlugin(properties.plugin, pluginData, pluginsUseLocalCompose, pluginLocalComposePrefix);
            setContent(renderResponse.data);
            setStatus(renderResponse.status === 200);
            };
          downloadContent();

        }
        else {
          setStatus(false); 
        }


    }).catch(error => {
      setStatus(false);
  });
      
  }, [pageSectionsOrder]);

  useEffect(() => {
    if (status === false) {
      dispatch(hidePluginSection(properties.plugin.name));
    }
  }, [status]);

  if (status) {

    const options = {
      replace: domNode => {
        if(!domNode.attribs) {
          return;
        }

        if(domNode.name === '!doctype html') {
          return <></>;
        }

        if(!acceptedTags.includes(domNode.name)) {
          return (
            <>{domToReact(domNode.children, options)}</>
          );
        }

        if(domNode.name === 'html' || domNode.name === 'head' || domNode.name === 'body') {
          return (
            <>{domToReact(domNode.children, options)}</>
          );
        }

        if(domNode.type === 'script') {
          var script = document.createElement('script');
          if(domNode.attribs.src) {
            script.src = domNode.attribs.src;
          }
          script.type = 'text/javascript';
          script.innerText = `${domToReact(domNode.children, options)}`;
          document.getElementById(`${properties.plugin.name}`).appendChild(script);
          return <></>;
        }

      }
    }

    return (
      <Section title={properties.title} pluginID={properties.pluginID} >
        <div id={properties.plugin.name}>
          {parse(`${content}`, options)}
        </div>
      </Section>
      
    );
  }
  
  else {
    
    return null
  }
  
}


async function evaluatePlugin(plugin, type, pluginsUseLocalCompose, pluginLocalComposePrefix) {

  switch(type) {
    case 'Component':
      type = 'ComponentInstance'
      break
    case 'Module':
      type = 'ModuleInstance'
      break
    case 'ComponentDefinition':
      type = 'Component'
      break
    case 'ModuleDefinition':
      type = 'Module'
      break
  }
  return await axios({
    method: 'POST',
    url: `${publicRuntimeConfig.backend}/callPlugin`,
    data: {
      name: plugin.name,
      endpoint: 'evaluate',
      category: 'rendering',
      data: {
        type: type
      },
      prefix: pluginsUseLocalCompose ? pluginLocalComposePrefix : null
    }
  }).then(response => {
    return response.status === 200;
  }).catch(error => {
    return false
  });
}

async function getShareLink(uriSuffix) {
  const token = localStorage.getItem('userToken');
  return await axios({
    method: 'GET',
    url: `${publicRuntimeConfig.backend}/${uriSuffix}/shareLink`,
    user: token, // Assuming the API requires a user token for authentication
    headers: {
      'Accept': 'text/plain',
      'X-authorization': token
    }
  }).then(response => {
    return response.data;
  }
  ).catch(error => {
    return error;
  });
}

async function runPlugin(plugin, pluginData, pluginsUseLocalCompose, pluginLocalComposePrefix) {
  return await axios({
    method: 'POST',
    url: `${publicRuntimeConfig.backend}/callPlugin`,
    data: {
      name: plugin.name,
      endpoint: 'run',
      data: pluginData,
      category: 'rendering',
      prefix: pluginsUseLocalCompose ? pluginLocalComposePrefix : null
    }
  }).then(response => {
    return response;
  }).catch(error => {
    return error;
  })
  
}
