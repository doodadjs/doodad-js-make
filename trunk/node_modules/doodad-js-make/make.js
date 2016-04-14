// dOOdad - Object-oriented programming framework
// File: make.js - Make command
// Project home: https://sourceforge.net/projects/doodad-js/
// Trunk: svn checkout svn://svn.code.sf.net/p/doodad-js/code/trunk doodad-js-code
// Author: Claude Petit, Quebec city
// Contact: doodadjs [at] gmail.com
// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
// License: Apache V2
//
//	Copyright 2016 Claude Petit
//
//	Licensed under the Apache License, Version 2.0 (the "License");
//	you may not use this file except in compliance with the License.
//	You may obtain a copy of the License at
//
//		http://www.apache.org/licenses/LICENSE-2.0
//
//	Unless required by applicable law or agreed to in writing, software
//	distributed under the License is distributed on an "AS IS" BASIS,
//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//	See the License for the specific language governing permissions and
//	limitations under the License.

"use strict";

function startup() {
	const make = root.Make;
	
	let index = 2;
	
	let arg = (process.argv[index++] || '').split('=', 2);
	
	let command = arg[0].toLowerCase();
	
	if (['make', 'install', 'test', 'custom'].indexOf(command) < 0) {
		console.error("Invalid command. Available commands are : 'make', 'install', 'test' and 'custom'.");
		process.exit(1);
	};

	if (command === 'custom') {
		let name = arg[1] || process.argv[index++];
		if (!name) {
			console.error("Missing argument to command 'custom'.");
			process.exit(1);
		};
		command = name;
	};

	return make.run(command);
};

const root = require('doodad-js').createRoot(null, {startup: {fromSource: true}});

const doodad = root.Doodad,
	tools = doodad.Tools,
	types = doodad.Types,
	modules = doodad.Modules,
	namespaces = doodad.Namespaces,
	
	Promise = types.getPromise();

function loadModule(name) {
	return function(DD_MODULES) { 
		return modules.loadManifest(name)
			.then(function(mod) {
				return mod.add(DD_MODULES)
			}); 
	};
};
	
function endLoading() {
	return function(DD_MODULES) { 
		return namespaces.load(DD_MODULES, startup); 
	};
};
	
return Promise.resolve( {} )
	.then(loadModule('doodad-js-io'))
	.then(loadModule('doodad-js-minifiers'))
	.then(loadModule('doodad-js-safeeval'))
	.then(loadModule('doodad-js-unicode'))
	.then(loadModule('doodad-js-locale'))
	.then(loadModule('doodad-js-make'))
	.then(endLoading())
	['catch'](function(err) {
		console.error(err.stack);
		process.exit(1);
	});