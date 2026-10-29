import Section from '../../Sections/Section';
import Plugin from '../../Sections/Plugin.js';

import { useSelector } from 'react-redux';
import { Fragment, useState } from 'react';
import TableBuilder from './TableBuilder';

import CustomComponents from '../CustomComponents.js';
import { compileFile } from '../Parsing/compileFile';
import Visualization from '../../Sections/Visualization.js';

export default function GenericContent({ json, uri, metadata, plugins, type, translation }) {
  if (metadata) {
    if (!json || !json.metadata) return null;
    compileFile(json);
    const content = json.metadata.map((metadata, index) => {
      const metadataKey = metadata.title || metadata.id || index;
      return (
        <TableBuilder
          uri={uri}
          prefixes={json.prefixes}
          table={metadata}
          metadata={true}
          key={metadataKey}
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
        <TableSection
          uri={uri}
          json={json}
          table={table}
          page={page}
          key={`${page}-${uri}`}
          translation={translation}
        />
      );
    }
    if (page.startsWith('PLUGIN: ')) {
      const title = page.substring(8, page.length)
      const plugin = plugins.rendering.filter(plugin => plugin.name === title)[0]
      return (
        <Plugin plugin={plugin} type={type} uri={uri} title={title} key={page} pluginKey={page} pluginID={page} />
      );

    }

    if (page === 'Visualization') {
      return (
        <Visualization uri={uri} key={`${page}-${uri}`} />
      )
    }

    const ComponentToRender = CustomComponents[page];
    if (ComponentToRender) {
      return (
        <CustomComponentSection
          Component={ComponentToRender}
          uri={uri}
          page={page}
          key={`${page}-${uri}`}
          translation={translation}
        />
      );
    }

  });

  return <Fragment>{content}</Fragment>;
}

function TableSection({ uri, json, table, page, translation }) {
  const [hasContent, setHasContent] = useState(true);
  return (
    <Section
      id={page}
      title={table.title}
      translation={translation}
      hidden={!hasContent}
    >
      <TableBuilder
        uri={uri}
        prefixes={json.prefixes}
        table={table}
        onContentChange={setHasContent}
      />
    </Section>
  );
}

function CustomComponentSection({ Component, uri, page, translation }) {
  const [hasContent, setHasContent] = useState(true);
  return (
    <Section id={page} title={page} translation={translation} hidden={!hasContent}>
      <Component uri={uri} onContentChange={setHasContent} />
    </Section>
  );
}

