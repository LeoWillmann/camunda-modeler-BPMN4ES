import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { getExtensionElement } from "./util.js";
import { addZeebeVariables } from "./ZeebeElementExtension.js";

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

KeiMenuProvider.prototype.getHeaderEntries = function (target) {
    // The KEI selector header to include a textbox for entering target values.
    return [
        {
            id: 'kei-popup-textbox-header',
            // This text offsets the textbox for styling purposes.
            // It has css styling applied to hide the text in kei-input-textbox-header 
            label: this._translate('This is important text here'),
            // Uses the imageHTML to create a textbox input field.
            imageHtml: `
                <div >
                    <input
                        type="number" 
                        id="kei-popup-target-value-input"
                        placeholder="${this._translate('Enter Target Value')}" 
                        style="box-sizing: border-box;"
                    />
                </div>
            `,
            // No action, so it's not clickable
            action: null,
            // Optional: prevent highlighting on hover
            className: 'no-hover kei-input-textbox-header',
        }
    ];
};

KeiMenuProvider.prototype.getEntries = function (target) {
    const self = this;

    const indicatorEntries = self._indicators.flatMap(function (indicatorCategory) {
        const category = indicatorCategory.category;

        return indicatorCategory.indicators.map(function (indicator) {
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

    return indicatorEntries;
};

// TODO: These values should be set through a properties panel.
function createAction(moddle, modeling, target, indicator) {
    return function (event, entry) {
        const targetValue = Number(document.getElementById('kei-popup-target-value-input').value);
        console.log('Adding KEI: "' + indicator.name +
            '", target value: ' + targetValue +
            ', to element: "' + target.id + '"');

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
