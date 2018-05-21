#!/usr/bin/env node
// doodad-js - Object-oriented programming framework
// File: make.js - Make command
// Project home: https://github.com/doodadjs/
// Author: Claude Petit, Quebec city
// Contact: doodadjs [at] gmail.com
// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
// License: Apache V2
//
//	Copyright 2015-2018 Claude Petit
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

function startup(root) {
	const doodad = root.Doodad,
		tools = doodad.Tools,
		types = doodad.Types,
		modules = doodad.Modules,
		//namespaces = doodad.Namespaces,

		Promise = types.getPromise();

	const options = {
		Make: {
		},
	};

	let command = '',
		index = 2;

	const commandOptions = {};

	while (index < process.argv.length) {
		const arg = tools.split((process.argv[index++] || ''), '=', 2);

		if (arg[0][0] === '-') {
			const name = arg[0];
			if ((name === '-O') || (name === '--option')) {
				const keyValArg = (arg[1] ? arg[1] : process.argv[index++]);
				const keyVal = tools.split(keyValArg, '=', 2);
				if (!keyVal[0]) {
					console.error("Missing key argument.");
					tools.abortScript(1);
				};
				const key = keyVal[0];
				const val = (keyVal.length > 1 ? keyVal[1] : process.argv[index++]);
				commandOptions[key] = val;
			} else if ((name === '-v') || (name === '--verbose')) {
				tools.setOptions({logLevel: 1});
			} else if (name === '-vv') {
				tools.setOptions({logLevel: 0});
			} else {
				console.error("Invalid options.");
				tools.abortScript(1);
			};
		} else {
			command = arg[0].toLowerCase();

			if (['make', 'install', 'test', 'custom'].indexOf(command) < 0) {
				throw new types.Error("Invalid command '~0~'. Available commands are : 'make', 'install', 'test' and 'custom'.", [command]);
			};

			if (command === 'custom') {
				let name = arg[1] || process.argv[index++];
				if (!name) {
					throw new types.Error("Missing argument to command 'custom'.");
				};
				command = name;
			};
		};
	};

	if (!command) {
		throw new types.Error("Missing command.");
	};

	function run(root) {
		return root.Make.run(command, commandOptions);
	};

	return modules.load([
				{
					module: '@doodad-js/make',
				},
			], options)
		.then(run);
};

require('@doodad-js/core').createRoot(null, {startup: {fromSource: true}, 'Doodad.Tools': {logLevel: 2, noWatch: true}})
	.then(startup)
	.catch(ex => {
		console.error(ex.stack);
		process.exit(1);
	});
