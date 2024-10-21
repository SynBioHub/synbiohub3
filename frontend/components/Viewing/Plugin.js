import axios from 'axios';
import { useEffect, useState } from 'react';
import parse, { domToReact } from 'html-react-parser';
import React from 'react';

import feConfig from "../../config.json";
import { useSelector, useDispatch } from 'react-redux';

import Section from './Sections/Section';
import { updateHiddenSections } from '../../redux/actions';

export default function Plugin(properties) {
  const [status, setStatus] = useState(null);
  const [content, setContent] = useState('<div>Loading Data From Plugin...</div>');
  const pageSectionsOrder = useSelector(state => state.pageSections.order);
  const hiddenSections = useSelector(state => state.pageSections.hiddenSections);
  const dispatch = useDispatch();

  const acceptedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'div', 'span', 'br', 'hr', 'pre', 'code', 'blockquote', 'strong', 'em', 'i', 'b', 'u', 's', 'sub', 'sup', 'del', 'ins', 'mark', 'small', 'big', 'abbr', 'cite', 'dfn', 'kbd', 'q', 'samp', 'var', 'time', 'address', 'article', 'aside', 'footer', 'header', 'nav', 'section', 'main', 'figure', 'figcaption', 'details', 'summary', 'dialog', 'menu', 'menuitem', 'menuitem', 'meter', 'progress', 'output', 'canvas', 'audio', 'video', 'iframe', 'object', 'embed', 'param', 'source', 'track', 'map', 'area', 'form', 'label', 'input', 'button', 'select', 'datalist', 'optgroup', 'option', 'textarea', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter', 'details', 'summary', 'command', 'menu', 'menuitem', 'menuitem', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', 'map', 'track', 'source', 'param', 'iframe', 'embed', 'object', 'canvas', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', 'map', 'track', 'source', 'param', 'iframe', 'embed', 'object', 'canvas', 'script', 'noscript', 'style', 'link', 'meta', 'title', 'base', 'head', 'body', 'html', 'br', 'hr', 'wbr', 'img', 'area', ]

  
  
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
    instanceUrl: `${feConfig.backend}/`,
    size: 1,
    type: type
  };

  useEffect(() => {
    if (status === null) {
      evaluatePlugin(properties.plugin, properties.type).then(responseStatus => {
        setStatus(responseStatus)

        if(responseStatus) {
          const downloadContent = async () => {
            const renderResponse = await runPlugin(properties.plugin, pluginData);
            setContent(renderResponse.data);
            setStatus(renderResponse.status === 200);
            };
          downloadContent();

        }


    });
      
    }
    
    if (status) {
      dispatch(updateHiddenSections(hiddenSections.filter(page => page != `PLUGIN: ${properties.plugin.name}`)))
    }
    else {
      dispatch(updateHiddenSections(hiddenSections.filter(page => page != `PLUGIN: ${properties.plugin.name}`).concat(`PLUGIN: ${properties.plugin.name}`)))
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
    url: `${feConfig.backend}/call`,
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
    url: `${feConfig.backend}/call`,
    params: {
      name: plugin.name,
      endpoint: 'run',
      data: pluginData,
      category: 'rendering'
    }
  }).then(response => {
    return response;
  }).catch(error => {
    return error;
  })
  
}
