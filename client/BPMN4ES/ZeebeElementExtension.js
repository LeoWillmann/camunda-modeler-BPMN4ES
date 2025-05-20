import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { getExtensionElement } from "./util.js";

// Zeebe constants
const MODDLE_ZEEBE_IOMAP = "zeebe:IoMapping";
const MODDLE_ZEEBE_INPUT = "zeebe:Input";
const MODDLE_ZEEBE_EXECUTION_LISTENERS = "zeebe:ExecutionListeners";
const MODDLE_ZEEBE_EXECUTION_LISTENER = "zeebe:ExecutionListener";
const ZEEBE_INPUT = "inputParameters";
const ZEEBE_LISTENER = "listeners";

// Job worker constant
const QUERY_WORKER = "custom-metrics_query";
// Variable name constants
const TYPE = "__customMetricsType";
const DATA = "__customMetricsData";
const TARGET = "__customMetricsTarget";

export function addZeebeVariables(moddle, modeling, target, indicator, targetValue) {
    // get or create extensionElements of the target element
    const businessObject = getBusinessObject(target);
    const extensionElements = businessObject.extensionElements || moddle.create("bpmn:ExtensionElements");

    // get or create Zeebe input variables extensionElement
    let ioMap = getExtensionElement(
        businessObject,
        MODDLE_ZEEBE_IOMAP
    );

    if (!ioMap) {
        ioMap = moddle.create(MODDLE_ZEEBE_IOMAP);
        ioMap.$parent = businessObject;
        extensionElements.get("values").push(ioMap);
    }

    // remove variable data of names we want to add.
    let inputArray = ioMap.get(ZEEBE_INPUT);
    inputArray.pop(inputArray.findIndex((element) => element.target == TYPE));
    inputArray.pop(inputArray.findIndex((element) => element.target == DATA));
    inputArray.pop(inputArray.findIndex((element) => element.target == TARGET));

    // push variables to input array
    inputArray.push(zeebeInputProperties(moddle, JSON.stringify(indicator.id), TYPE, ioMap));
    inputArray.push(zeebeInputProperties(moddle, JSON.stringify(JSON.stringify(indicator.data)), DATA, ioMap));
    inputArray.push(zeebeInputProperties(moddle, targetValue, TARGET, ioMap));

    // add Zeebe execution listener
    let executionListener = getExtensionElement(
        businessObject,
        MODDLE_ZEEBE_EXECUTION_LISTENERS
    );

    if (!executionListener) {
        executionListener = moddle.create(MODDLE_ZEEBE_EXECUTION_LISTENERS);
        executionListener.$parent = businessObject;
        extensionElements.get("values").push(executionListener);
    }

    // remove possible old execution listener and push new one
    inputArray = executionListener.get(ZEEBE_LISTENER);
    inputArray.pop(inputArray.findIndex((element) => element.type == QUERY_WORKER));
    inputArray.push(zeebeExecutionListenerProperties(moddle, QUERY_WORKER, executionListener));

    // update element properties
    modeling.updateProperties(target, {
        extensionElements,
    });
}

function zeebeInputProperties(moddle, source, target, parent) {
    let elementProperties = {
        source: '=' + source,
        target: target,
    };

    const input = moddle.create(MODDLE_ZEEBE_INPUT, elementProperties);
    input.$parent = parent;

    return input;
}

function zeebeExecutionListenerProperties(moddle, type, parent) {
    let elementProperties = {
        eventType: "end",
        type: type,
    };

    const input = moddle.create(MODDLE_ZEEBE_EXECUTION_LISTENER, elementProperties);
    input.$parent = parent;

    return input;
}