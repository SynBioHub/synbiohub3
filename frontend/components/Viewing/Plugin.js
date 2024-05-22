import axios from 'axios';
import { useEffect, useState } from 'react';
import parse, { domToReact } from 'html-react-parser';
import React from 'react';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import { useSelector } from 'react-redux';

import Section from './Sections/Section';

export default function Plugin(properties) {
  const [status, setStatus] = useState(null);
  const [content, setContent] = useState('<div>Loading Data From Plugin...</div>');
  const pageSectionsOrder = useSelector(state => state.pageSections.order);
  
  const uri = properties.uri;

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

  const pluginData = {
    uri: uri,
    instanceUrl: `${publicRuntimeConfig.backend}/`,
    size: 1,
    type: type
  };

  useEffect(() => {
    if (status === null) {
      evaluatePlugin(properties.plugin, properties.type).then(status => setStatus(status));
    }
    
    if (status) {
      const downloadContent = async () => {
      const toRender = await runPlugin(properties.plugin, pluginData);
      setContent(toRender);
      };
      downloadContent();
    }
  }, [status, pageSectionsOrder]);

  if (status) {


    const options = {
      replace: domNode => {
        if(!domNode.attribs) {
          return;
        }

        if(domNode.name === '!doctype html') {
          return <></>;
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
      <Section title={properties.title} key={properties.index} pluginID={properties.page} >
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


async function evaluatePlugin(plugin, type) {

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
    url: `${publicRuntimeConfig.backend}/call`,
    params: {
      name: plugin.name,
      endpoint: 'evaluate',
      category: 'rendering',
      data: {
        type: type
      }
    }
  }).then(response => {
    return response.status === 200;
  })
  .catch(error => {
    return false;
  });
}

async function runPlugin(plugin, pluginData) {
  return await axios({
    method: 'POST',
    url: `${publicRuntimeConfig.backend}/call`,
    params: {
      name: plugin.name,
      endpoint: 'run',
      data: pluginData,
      category: 'rendering'
    }
  }).then(response => {
    return response.data;
  }).catch(error => {
    return `There was an error with ${plugin.name}`;
  })
  
}
