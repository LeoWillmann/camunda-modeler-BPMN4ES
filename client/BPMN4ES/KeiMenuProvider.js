import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { getExtensionElement } from "./util.js";

const INDICATORS = [
    {
        category: "energy",
        indicators: [
            {
                name: "Energy Consumption",
                id: "energy-consumption",
                icon_name: "bolt",
                unit: "kwh",
                data: {
                    max: 100,
                    offset: -20,
                }
            },
            {
                name: "Renewable Energy",
                id: "renewable-energy",
                icon_name: "sunny",
                unit: "kwh",
                data: {
                    max: 10
                }
            },
            {
                name: "Transportation Energy",
                id: "transportation-energy",
                icon_name: "local_shipping",
                unit: "kwh",
                data: {
                    max: 100
                }
            },
        ],
    },
    {
        category: "emissions",
        indicators: [
            {
                name: "Carbon Emissions",
                id: "carbon-emissions",
                icon_name: "co2",
                unit: "kg",
                data: {
                    max: 100
                }
            },
        ],
    },
    {
        category: "waste",
        indicators: [
            {
                name: "Recyclable Waste",
                id: "recyclable-waste",
                icon_name: "recycling",
                unit: "kg",
                data: {
                    max: 100
                }
            },
        ],
    },
];

export default function KeiMenuProvider(
    popupMenu,
    modeling,
    moddle,
    translate
) {
    this._popupMenu = popupMenu;
    this._modeling = modeling;
    this._translate = translate;
    this._moddle = moddle;

    this._indicators = INDICATORS;

    this._popupMenu.registerProvider("kei-selector", this);
}

KeiMenuProvider.$inject = [
    "popupMenu",
    "modeling",
    "moddle",
    "translate"
];

KeiMenuProvider.prototype.getEntries = function (target) {
    const self = this;

    const entries = self._indicators.flatMap(function (indicator) {
        const category = indicator.category;

        return indicator.indicators.map(function (indicator) {
            return {
                title: self._translate(indicator.name),
                label: self._translate(indicator.name),
                className: "kei-icon kei-icon-" + indicator.id,
                id: indicator.id,
                group: category,
                action: createAction(self._moddle, self._modeling, target, indicator),
            };
        });
    });

    return entries;
};

// TODO: These values should be set through a properties panel.
function createAction(moddle, modeling, target, indicator) {
    return function (event, entry) {
        console.log(target);

        // INFO: prompt() not supported in camunda modeler
        // let targetValue = prompt(`Enter the target value for ${indicator.name} (leave empty if only monitored)`);
        let targetValue = 0;

        // adds BPMN4ES XML
        addBPMN4ES(moddle, modeling, target, indicator, targetValue);

        // adds Zeebe engine variables
        addZeebeVariables(moddle, modeling, target, indicator, targetValue);
    };
}

function addBPMN4ES(moddle, modeling, target, indicator, targetValue) {
    let keiProperties = {
        id: indicator.id,
        unit: indicator.unit,
        icon: indicator.icon_name,
        targetValue: targetValue
    };

    const businessObject = getBusinessObject(target);
    const extensionElements =
        businessObject.extensionElements ||
        moddle.create("bpmn:ExtensionElements");

    let environmentalIndicators = getExtensionElement(
        businessObject,
        "bpmn4es:environmentalIndicators"
    );

    if (!environmentalIndicators) {
        environmentalIndicators = moddle.create(
            "bpmn4es:environmentalIndicators"
        );
        environmentalIndicators.$parent = businessObject;
        extensionElements.get("values").push(environmentalIndicators);
    }

    // For now, only one indicator is allowed, so remove any existing ones before adding the new one.
    environmentalIndicators.get("indicators").length = 0;

    const kei = moddle.create(
        "bpmn4es:keyEnvironmentalIndicator",
        keiProperties
    );
    kei.$parent = environmentalIndicators;
    environmentalIndicators.get("indicators").push(kei);

    modeling.updateProperties(target, {
        extensionElements,
    });
}

function addZeebeVariables(moddle, modeling, target, indicator, targetValue) {
    console.log("moddle", moddle);
    const ZEEBE_IOMAP = "zeebe:IoMapping";
    const ZEEBE_INPUT = "inputParameters";
    const ZEEBE_EXECUTION_LISTENERS = "zeebe:ExecutionListeners";
    const ZEEBE_LISTENER = "listeners";
    const QUERY_WORKER = "custom-metrics_query";
    const TYPE = "__customMetricsType";
    const DATA = "__customMetricsData";
    const TARGET = "__customMetricsTarget";

    // get or create extensionElements of the target element
    const businessObject = getBusinessObject(target);
    const extensionElements = businessObject.extensionElements || moddle.create("bpmn:ExtensionElements");

    // get or create Zeebe input variables extensionElement
    let ioMap = getExtensionElement(
        businessObject,
        ZEEBE_IOMAP
    );

    if (!ioMap) {
        ioMap = moddle.create(ZEEBE_IOMAP);
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
    inputArray.push(zeebeInputProperties(moddle, JSON.stringify(indicator.id), TYPE, ioMap));
    inputArray.push(zeebeInputProperties(moddle, JSON.stringify(JSON.stringify(indicator.data)), DATA, ioMap));
    inputArray.push(zeebeInputProperties(moddle, targetValue, TARGET, ioMap));

    // add Zeebe execution listener
    let executionListener = getExtensionElement(
        businessObject,
        ZEEBE_EXECUTION_LISTENERS
    );

    if (!executionListener) {
        executionListener = moddle.create(ZEEBE_EXECUTION_LISTENERS);
        executionListener.$parent = businessObject;
        extensionElements.get("values").push(executionListener);
    }

    inputArray = executionListener.get(ZEEBE_LISTENER);
    inputArray.pop(inputArray.findIndex((element) => element.type == QUERY_WORKER));
    inputArray.push(zeebeExecutionListenerProperties(moddle, QUERY_WORKER, executionListener));

    // update element properties
    modeling.updateProperties(target, {
        extensionElements,
    });
}

function zeebeInputProperties(moddle, source, target, parent) {
    const elementName = "zeebe:Input";

    let elementProperties = {
        source: '=' + source,
        target: target,
    };

    const input = moddle.create(elementName, elementProperties);
    input.$parent = parent;

    return input;
}

function zeebeExecutionListenerProperties(moddle, type, parent) {
    const elementName = "zeebe:ExecutionListener";

    let elementProperties = {
        eventType: "end",
        type: type,
    };

    const input = moddle.create(elementName, elementProperties);
    input.$parent = parent;

    return input;
}