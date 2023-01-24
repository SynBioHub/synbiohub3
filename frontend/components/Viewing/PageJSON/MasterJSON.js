import ComponentDefinition from './Types/ComponentDefinition.json';
import Collection from './Types/Collection.json';
import Sequence from './Types/Sequence.json';

const TypeToJson = {
  'http://sbols.org/v2#ComponentDefinition': ComponentDefinition,
  'http://sbols.org/v2#Collection': Collection,
  'http://sbols.org/v2#Sequence': Sequence
};

export default TypeToJson;
