
// Register a plugin for bpmn-js
import { registerBpmnJSPlugin  } from 'camunda-modeler-plugin-helpers';
import KeiContextPad from './BPMN4ES/index.js'
registerBpmnJSPlugin(KeiContextPad);

// register moddle extension
import { registerBpmnJSModdleExtension } from 'camunda-modeler-plugin-helpers';
import BPMN4ES_Extension from './BPMN4ES/resources/bpmn4es.json';
registerBpmnJSModdleExtension(BPMN4ES_Extension);
