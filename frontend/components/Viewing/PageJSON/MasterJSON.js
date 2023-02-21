import ComponentDefinition from './Types/ComponentDefinition.json';
import Collection from './Types/Collection.json';
import Sequence from './Types/Sequence.json';
import Model from './Types/Model.json';
import ModuleDefinition from './Types/ModuleDefinition.json';
import Implementation from './Types/Implementation.json';
import Range from './Types/Range.json';

const TypeToJson = {
  'http://sbols.org/v2#ComponentDefinition': ComponentDefinition,
  'http://sbols.org/v2#Collection': Collection,
  'http://sbols.org/v2#Sequence': Sequence,
  'http://sbols.org/v2#Model': Model,
  'http://sbols.org/v2#ModuleDefinition': ModuleDefinition,
  'http://sbols.org/v2#Implementation': Implementation,
  'http://sbols.org/v2#Range': Range
};

export default TypeToJson;
