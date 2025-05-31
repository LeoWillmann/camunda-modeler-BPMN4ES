import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { getExtensionElement } from "./util.js";

// Zeebe constants
const MODDLE_ZEEBE_IOMAP = "zeebe:IoMapping";
const MODDLE_ZEEBE_INPUT = "zeebe:Input";
const MODDLE_ZEEBE_OUTPUT = "zeebe:Output";
const MODDLE_ZEEBE_EXECUTION_LISTENERS = "zeebe:ExecutionListeners";
const MODDLE_ZEEBE_EXECUTION_LISTENER = "zeebe:ExecutionListener";
const ZEEBE_INPUT = "inputParameters";
const ZEEBE_OUTPUT = "outputParameters";
const ZEEBE_LISTENER = "listeners";

// Job worker constant
const QUERY_WORKER = "custom-metrics_query";

// Variable name constants
const TYPE = "__customMetricsType";
const DATA = "__customMetricsData";
const TARGET = "__customMetricsTarget";
const TARGET_VALUE_PREFIX = "TargetValue_"; // meant to be appended with the activity ID

export function addZeebeVariables(moddle, modeling, target, indicator, targetValue) {
    // get or create extensionElements of the target element
    const businessObject = getBusinessObject(target);
    const extensionElements = businessObject.extensionElements || moddle.create("bpmn:ExtensionElements");

    // remove Zeebe variables to update them
    removeZeebeVariables(modeling, target, extensionElements);

    addZeebeInputOutput(moddle, indicator, targetValue, target, businessObject, extensionElements);
    addZeebeExecutionListener(moddle, businessObject, extensionElements);

    // update element properties
    modeling.updateProperties(target, {
        extensionElements,
    });
}

// This function removes Zeebe variables and execution listener from the target element.
export function removeZeebeVariables(modeling, target, extensionElements) {
    // get or create extensionElements of the target element
    const businessObject = getBusinessObject(target);

    // get Zeebe IO variables extensionElement
    let ioMap = getExtensionElement(
        businessObject,
        MODDLE_ZEEBE_IOMAP
    );

    if (ioMap) {
        // if ioMap exists, remove input and output variables
        const inputArray = ioMap.get(ZEEBE_INPUT);
        let index = inputArray.findIndex((element) => element.target == TYPE);
        inputArray.splice(index, index !== -1 ? 1 : 0)
        index = inputArray.findIndex((element) => element.target == DATA);
        inputArray.splice(index, index !== -1 ? 1 : 0)
        index = inputArray.findIndex((element) => element.target == TARGET);
        inputArray.splice(index, index !== -1 ? 1 : 0)

        let outputArray = ioMap.get(ZEEBE_OUTPUT);
        index = outputArray.findIndex((element) => element.target == TARGET_VALUE_PREFIX + target.id);
        outputArray.splice(index, index !== -1 ? 1 : 0)
    }

    // get Zeebe execution listener extensionElement
    let executionListener = getExtensionElement(
        businessObject,
        MODDLE_ZEEBE_EXECUTION_LISTENERS
    );

    if (executionListener) {
        // if executionListener exists, remove the custom metrics query listener
        const list = executionListener.get(ZEEBE_LISTENER);
        let index = list.findIndex((element) => element.type == QUERY_WORKER);
        list.splice(index, index !== -1 ? 1 : 0)
    }

    // update element properties
    modeling.updateProperties(target, {
        extensionElements,
    });
}

// This function adds Zeebe input and output variables for the custom metrics
function addZeebeInputOutput(moddle, indicator, targetValue, target, businessObject, extensionElements) {
    // get or create Zeebe IO variables extensionElement
    let ioMap = getExtensionElement(
        businessObject,
        MODDLE_ZEEBE_IOMAP
    );

    if (!ioMap) {
        ioMap = moddle.create(MODDLE_ZEEBE_IOMAP);
        ioMap.$parent = businessObject;
        extensionElements.get("values").push(ioMap);
    }

    // push variables to input array
    let inputArray = ioMap.get(ZEEBE_INPUT);
    inputArray.push(zeebeInputOutputProperties(moddle, MODDLE_ZEEBE_INPUT, JSON.stringify(indicator.id), TYPE, ioMap));
    inputArray.push(zeebeInputOutputProperties(moddle, MODDLE_ZEEBE_INPUT, JSON.stringify(JSON.stringify(indicator.data)), DATA, ioMap));
    inputArray.push(zeebeInputOutputProperties(moddle, MODDLE_ZEEBE_INPUT, targetValue, TARGET, ioMap));


    // push variables to output array if the targetValue is not 0
    let outputArray = ioMap.get(ZEEBE_OUTPUT);
    if (targetValue !== 0) {
        outputArray.push(zeebeInputOutputProperties(moddle, MODDLE_ZEEBE_OUTPUT, TARGET, TARGET_VALUE_PREFIX + target.id, ioMap));
    }
}

// This function adds Zeebe a execution listener for the custom metrics
function addZeebeExecutionListener(moddle, businessObject, extensionElements) {
    // get or create Zeebe execution listener extensionElement
    let executionListener = getExtensionElement(
        businessObject,
        MODDLE_ZEEBE_EXECUTION_LISTENERS
    );

    if (!executionListener) {
        executionListener = moddle.create(MODDLE_ZEEBE_EXECUTION_LISTENERS);
        executionListener.$parent = businessObject;
        extensionElements.get("values").push(executionListener);
    }

    // push execution listener
    let list = executionListener.get(ZEEBE_LISTENER);
    list.push(zeebeExecutionListenerProperties(moddle, QUERY_WORKER, executionListener));
}

function zeebeInputOutputProperties(moddle, moddleType, source, target, parent) {
    let elementProperties = {
        source: '=' + source,
        target: target,
    };

    const result = moddle.create(moddleType, elementProperties);
    result.$parent = parent;

    return result;
}

function zeebeExecutionListenerProperties(moddle, type, parent) {
    let elementProperties = {
        eventType: "end",
        type: type,
    };

    const result = moddle.create(MODDLE_ZEEBE_EXECUTION_LISTENER, elementProperties);
    result.$parent = parent;

    return result;
}