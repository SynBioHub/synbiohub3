import Section from '../../Sections/Section';
import Plugin from '../../Plugin';

import { useSelector } from 'react-redux';
import { Fragment } from 'react';
import TableBuilder from './TableBuilder';

import CustomComponents from '../CustomComponents.js';
import { compileFile } from '../Parsing/compileFile';

export default function GenericContent({ json, uri, metadata, plugins, type }) {
  if (metadata) {
    if (!json || !json.metadata) return null;
    compileFile(json);
    const content = json.metadata.map((metadata, index) => {
      return (
        <TableBuilder
          uri={uri}
          prefixes={json.prefixes}
          table={metadata}
          metadata={true}
          key={index}
        />
      );
    });
    return <Fragment>{content}</Fragment>;
  }

  const pages = useSelector(state => state.pageSections.order);

  const content = pages.map((page, index) => {
    if (page.startsWith('$TABLES[') && json && json.tables) {
      const title = page.substring(8, page.length - 1);
      const table = json.tables.find(table => table.title.toLowerCase() === title.toLowerCase());
      if (!table) {
        return null;
      }
      return (
        <Section id={page} title={table.title} key={index}>
          <TableBuilder uri={uri} prefixes={json.prefixes} table={table} />
        </Section>
      );
    }
    if (page.startsWith('PLUGIN: ')) {
      const title = page.substring(8, page.length)
      const plugin = plugins.rendering.filter(plugin => plugin.name === title)[0]
      return (
        <Plugin plugin={plugin} type={type} uri={uri} title={title} key={index} pluginKey={index} pluginID={page} />
      );
        
    }

    const ComponentToRender = CustomComponents[page];
    if (ComponentToRender) {
      return (
        <Section title={page} key={index}>
          <ComponentToRender uri={uri} />
        </Section>
      );
    }

  });

  return <Fragment>{content}</Fragment>;
}

