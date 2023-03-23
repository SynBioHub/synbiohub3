import { Fragment, useEffect, useState } from 'react';
import MiniLoading from '../../../Reusable/MiniLoading';
import executeQueryFromTableJSON from '../Fetching/executeQueryFromTableJSON';
import getQueryStackTrace from '../Fetching/getQueryStackTrace';
import { parseQueryResult2 } from '../Fetching/parseQueryResult';
import useRegistries from '../Fetching/useRegistries';
import createRenderingObject from './createRenderingObject';
import SectionRenderer from './SectionRenderer';

function handleExternalFetch(
  stackTrace,
  key,
  sectionIndex,
  updateSectionsToParse,
  setLoading,
  registries,
  loading,
  error
) {
  if (!error && !loading) {
    setLoading(true);
    const queryUrl = registries.find(registry => {
      return stackTrace.uri.startsWith(registry.uri);
    })?.url;
    if (queryUrl) {
      executeQueryFromTableJSON(
        stackTrace.uri,
        stackTrace.prefixes,
        stackTrace.table,
        queryUrl
      ).then(result => {
        try {
          let [fetchedSection] = parseQueryResult2(
            stackTrace.table,
            result,
            stackTrace.prefixes
          );
          if (fetchedSection) {
            const [[newSection]] = Object.values(fetchedSection);
            updateSectionsToParse(key, sectionIndex, newSection);
            if (newSection.value) {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } catch (error) {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }
}

function createKeyToValueMap(
  sections,
  updateSectionsToParse,
  setTitleToValueMap,
  setSectionsToRender,
  setLoading,
  registries,
  registriesLoading,
  error
) {
  const map = {};
  const sectionsToRender = [];
  Object.keys(sections).forEach(key => {
    let currentSection = sections[key];
    const foundData = currentSection.some((possibility, index) => {
      const titleKey = possibility.section.title;
      if (
        possibility.section &&
        !possibility.section.predicates &&
        possibility.section.text
      ) {
        map[titleKey] = {
          value: possibility.section.text,
          index
        };
        sectionsToRender.push({ ...possibility.section, key: titleKey });
        return true;
      } else if (!possibility.value) {
        const stackTrace = getQueryStackTrace(
          possibility.table,
          possibility.section,
          possibility.result,
          possibility.prefixes
        );
        if (stackTrace) {
          handleExternalFetch(
            stackTrace,
            key,
            index,
            updateSectionsToParse,
            setLoading,
            registries,
            registriesLoading,
            error
          );
        }
      } else {
        map[titleKey] = { value: possibility.value, index };
        sectionsToRender.push({ ...possibility.section, key: titleKey });
        return true;
      }
    });
    if (!foundData && currentSection.length > 0) {
      const titleKey = currentSection[0].section.title;
      map[titleKey] = { value: '', index: 0 };
      sectionsToRender.push({ ...currentSection[0].section, key: titleKey });
    }
  });
  setSectionsToRender(sectionsToRender);
  Object.keys(map).forEach(key => {
    map[key].value = loadText(map[key].value, map);
  });
  setTitleToValueMap(map);
}

function loadText(template, args) {
  for (const key of Object.keys(args)) {
    template = template.replace(
      new RegExp(`\\$<${key}>`, 'g'),
      args[key].value
    );
  }

  return template;
}

export default function RowWrapper({ sections, metadata }) {
  // go through each of the sections in the and attempt to resolve what the section's value should be
  const [sectionsToParse, setSectionsToParse] = useState(sections);
  const [loading, setLoading] = useState(false);
  const [titleToValueMap, setTitleToValueMap] = useState({});
  const [sectionsToRender, setSectionsToRender] = useState([]);
  const [content, setContent] = useState(null);

  const { registries, loading: registriesLoading, error } = useRegistries();

  const updateSectionsToParse = (key, index, newSection) => {
    const newSections = { ...sectionsToParse };
    newSections[key][index] = newSection;
    setSectionsToParse(newSections);
  };

  useEffect(() => {
    if (sectionsToParse) {
      createKeyToValueMap(
        sectionsToParse,
        updateSectionsToParse,
        setTitleToValueMap,
        setSectionsToRender,
        setLoading,
        registries,
        registriesLoading,
        error
      );
    }
  }, [sectionsToParse, registries, registriesLoading, error]);

  useEffect(() => {
    const toRender = sectionsToRender
      .map(section => {
        return createRenderingObject(
          section,
          titleToValueMap[section.key].value,
          titleToValueMap
        );
      })
      .filter(section => !section.hidden);
    const newContent = toRender.map(section => {
      return (
        <SectionRenderer
          section={section}
          metadata={metadata}
          key={section.id}
        />
      );
    });
    setContent(newContent);
  }, [titleToValueMap, sectionsToRender]);

  if (loading) {
    return <MiniLoading height={10} width={50} />;
  }
  return <tr>{content}</tr>;
}
