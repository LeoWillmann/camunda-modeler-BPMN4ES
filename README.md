# Camunda Modeler BPMN4ES Plugin

![Compatible with Camunda Modeler version 5](https://img.shields.io/badge/Modeler_Version-5.0.0+-blue.svg) ![Plugin Type](https://img.shields.io/badge/Plugin%20Type-BPMN-orange.svg) 

This plugin serves as a modeler interface to model with key environmental indicators such as emissions and energy consumption and has been developed with the help of [camunda-modeler-plugin-example](https://github.com/camunda/camunda-modeler-plugin-example) template.

The source of the BPMN4ES implementation is from [michel-medema/BPMN4ES](https://github.com/michel-medema/BPMN4ES) and has only been changed make it compatible in the camunda modeler plugin environment and work with the Zeebe engine.

## Prerequisites
- [Camunda 8 Desktop Modeler](https://docs.camunda.io/docs/components/modeler/desktop-modeler/)

## What it does
The plugin adds a context menu option for bpmn tasks which allow the user to select a key environmental indicator to monitor for the given task. To monitor the values, the plugin automatically adds `Zeebe input variables` and `execution listener` with data defined in [KeiMenuProvider.js](client/BPMN4ES/KeiMenuProvider.js).

## How to monitor

The monitoring requires a `job worker` of the given name in [ZeebeElementExtension.js](client/BPMN4ES/ZeebeElementExtension.js) which can process the provided Zeebe input variable data. The [camunda-zeebe-BPMN4ES](https://github.com/LeoWillmann/camunda-zeebe-BPMN4ES) github repository provides a java spring boot template with already compatible and implemented job workers.

## Install the plugin

To make the Camunda Modeler aware of your plugin you must store or link the plugin to the [Camunda Modeler plugin directory](https://docs.camunda.io/docs/components/modeler/desktop-modeler/plugins/#plugging-into-camunda-modeler). 
Available utilities to create a symbolic link are [`mklink /d`](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/mklink) on Windows and [`ln -s`](https://linux.die.net/man/1/ln) on MacOS / Linux.

Re-start the app in order to recognize the newly linked plugin.

Warning: Make sure that the file path of the plugin does not contain any special characters such as `()`. It has shown to not load the plugins properly.

## Development

### Prerequisites
- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/) package manager to download and install required node.js dependencies

Verified to be working with node v22.15.1 (lts) and npm 10.9.2.

### Setup

Install node dependencies

```sh
npm install
```

### Building the Plugin

You may spawn the development setup to watch source files and re-build the client plugin on changes:

```sh
npm run dev
```

Given you've setup and linked your plugin [as explained above](#development-setup), you should be able to reload the modeler to pick up plugin changes. To do so, open the app's built in development toos via `F12`. Then, within the development tools press the reload shortcuts `CTRL + R` or `CMD + R` to reload the app.


To prepare the plugin for release, executing all necessary steps, run:

```sh
npm run all
```

## Icons
The icons shown is the [Google Material Symbols Outlined font](https://fonts.google.com/icons) and browse the website to find your own icons. Once found click on the icon and scroll down the popup to find the icon name, this is the name you will need to enter into the [KeiMenuProvider.js](client/BPMN4ES/KeiMenuProvider.js) icons field and [BPMN4ES.css](style/BPMN4ES/bpmn4es.css) kei-icon class's content.

## Additional Resources

* [List of existing plugins](https://github.com/camunda/camunda-modeler-plugins)
* [Plugins documentation](https://docs.camunda.io/docs/components/modeler/desktop-modeler/plugins/)


## Licence

MIT
