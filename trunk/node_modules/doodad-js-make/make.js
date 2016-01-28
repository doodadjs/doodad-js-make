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

const DD_MODULES = {};

require('doodad-js-io').add(DD_MODULES);
require('doodad-js-minifiers').add(DD_MODULES);
require('doodad-js-make/index.js').add(DD_MODULES);

const root = require('doodad-js').createRoot(DD_MODULES, {startup: {settings: {fromSource: true}}}),
	doodad = root.Doodad,
	tools = doodad.Tools,
	types = doodad.Types,
	namespaces = doodad.Namespaces;

function startup() {
	const make = root.Make;
	
	let command = (process.argv[2] || '').toLowerCase();
	
	if (['make', 'install', 'test', 'custom'].indexOf(command) < 0) {
		console.error("Invalid command. Available commands are : 'make', 'install', 'test' and 'custom'.");
		process.exit(1);
	};

	if (command === 'custom') {
		const name = process.argv[3];
		if (!name) {
			console.error("Missing parameter to command 'custom'.");
			process.exit(1);
		};
		command = name;
	};
	
	return make.run(command)
		['catch'](function(ex) {
			console.error(ex.stack);
			process.exit(1);
		});
};

//process.stdin.on('data', function(){})

namespaces.loadNamespaces(startup, false, null, DD_MODULES)
	['catch'](function(err) {
		console.error(err.stack);
		process.exit(1);
	});