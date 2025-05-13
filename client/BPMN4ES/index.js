import KeiContextPad from './KeiContextPad';
import KeiRenderer from './KeiRenderer';
import KeiMenuProvider from './KeiMenuProvider';

export default {
  __init__: [ 'keiContextPad', 'keiRenderer', 'keiMenuProvider' ],
  keiContextPad: [ 'type', KeiContextPad ],
  keiRenderer: [ 'type', KeiRenderer ],
  keiMenuProvider: [ 'type', KeiMenuProvider ]
};
