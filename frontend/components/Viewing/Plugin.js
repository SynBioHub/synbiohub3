import axios from 'axios';
import { useEffect, useState } from 'react';
import parse, { domToReact } from 'html-react-parser';

import Section from './Sections/Section';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

export default function Plugin(properties) {
  const [status, setStatus] = useState(null);
  const [content, setContent] = useState("");
  
  const uri = properties.uri;
  
  const pluginData = {
    uri: uri,
    top_level: uri,
    instanceUrl: `${publicRuntimeConfig.backend}/`,
    size: 1,
    type: properties.type
  };

  useEffect(() => {
    if (status == null) {
      evaluatePlugin(properties.plugin, properties.type).then(status => setStatus(status));
    }
    else if (status) {
      const downloadContent = async () => {
      const toRender = await runPlugin(properties.plugin, pluginData, uri, properties.type);
      setContent(toRender);
      };
      downloadContent();
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
    <Section title={properties.plugin.name} id={properties.plugin.name}>
      {parse(`${content}`, options)}
    </Section>);
  }
  
  else {
    //return <Section title={properties.plugin.name}>{`${properties.plugin.name} is not working`}</Section>; //return null for it not to be loaded
    return null
  }
  
}

async function evaluatePlugin(plugin, type) {
  return await axios({
    method: 'POST',
    url: `${publicRuntimeConfig.backend}/call`,
    params: {
      name: plugin.name,
      endpoint: 'evaluate',
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

async function runPlugin(plugin, pluginData, uri, type) {
  return await axios({
    method: 'POST',
    url: `${publicRuntimeConfig.backend}/call`,
    params: {
      name: plugin.name,
      endpoint: 'run',
      data: pluginData,
    }
  }).then(response => {
    return response.data;
  }).catch(error => {
    return `There was an error with ${plugin.name}`;
  })
}
