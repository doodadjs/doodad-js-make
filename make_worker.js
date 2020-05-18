#!/usr/bin/env node
// doodad-js - Object-oriented programming framework
// File: make_worker.js - Make command worker
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

const startup = function _startup(root, args) {
	const Promise = root.Doodad.Types.getPromise();
	return Promise.try(function tryStartupPromise() {
		const doodad = root.Doodad,
			tools = doodad.Tools,
			types = doodad.Types,
			modules = doodad.Modules;

		tools.trapUnhandledErrors();

		const options = {
			Make: {
			},
		};

		let command = '',
			index = 0;

		const commandOptions = {
			config: {},
			args: null,
		};
		let alive = false;
		let isVerbose = false;

		while (index < args.length) {
			const arg = tools.split((args[index++] || ''), '=', 2);

			if (arg[0] === '--') {
				commandOptions.args = args.slice(index);
				break;
			} else if (arg[0][0] === '-') {
				const name = arg[0];
				if ((name === '-O') || (name === '--option')) {
					const keyValArg = (arg[1] ? arg[1] : args[index++]);
					const keyVal = tools.split(keyValArg, '=', 2);
					const key = keyVal[0];
					if (!key) {
						throw new types.ValueError("Invalid option '~0~'.", [keyValArg]);
					};
					if (key === 'config') {
						throw new types.ValueError("Invalid option '~0~'. Please use '--config' instead.", [keyValArg]);
					};
					const val = (keyVal.length > 1 ? keyVal[1] : args[index++]);
					commandOptions[key] = val;
				} else if ((name === '-C') || (name === '--config')) {
					const keyValArg = (arg[1] ? arg[1] : args[index++]);
					const keyVal = tools.split(keyValArg, '=', 2);
					const key = keyVal[0];
					if (!key) {
						throw new types.ValueError("Invalid configuration '~0~'.", [keyValArg]);
					};
					const val = (keyVal.length > 1 ? keyVal[1] : args[index++]);
					commandOptions.config[key] = val;
				} else if ((name === '-v') || (name === '--verbose')) {
					tools.setOptions({logLevel: 1});
					isVerbose = true;
				} else if (name === '-vv') {
					tools.setOptions({logLevel: 0});
					isVerbose = true;
				} else if (name === '--alive') {
					// <PRB> Since ???, Travis times out after 10 minutes of silence (in stdout/stderr)...
					if (!alive) {
						alive = true;
						const setAliveSignal = function _setAliveSignal() {
							const timeout = setTimeout(function aliveSignal() {
								process.stdout.write(".");
								setAliveSignal();
							}, 1000 * 60 * 2);
							timeout.unref();
						};
						setAliveSignal();
					};
				} else {
					throw new types.ValueError("Invalid argument '~0~'.", [name]);
				};
			} else {
				command = arg[0].toLowerCase();

				if (['make', 'install', 'test', 'custom'].indexOf(command) < 0) {
					throw new types.ValueError("Invalid command '~0~'. Available commands are : 'make', 'install', 'test' and 'custom'.", [command]);
				};

				if (command === 'custom') {
					const name = arg[1] || args[index++];
					if (!name) {
						throw new types.ValueError("Missing argument to command 'custom'.");
					};
					command = name;
				};
			};
		};

		if (!command) {
			throw new types.ValueError("Missing command.");
		};

		if (isVerbose) {
			commandOptions.args = [...(commandOptions.args || []), "logLevel=" + tools.toString(tools.getOptions().logLevel)];
		};

		function run(root) {
			return root.Make.run(command, commandOptions);
		};

		return modules.load([
					{
						module: '@doodad-js/make',
					},
				], [options, commandOptions.config])
			.then(run);
	});
};

const main = function _main(args) {
	require('@doodad-js/core').createRoot(null, {startup: {fromSource: true}, 'Doodad.Tools': {logLevel: 2, noWatch: true}})
		.then(function(root) {
			return startup(root, args)
				.catch(function(err) {
					root.Doodad.Tools.catchAndExit(err);
				})
				.then(function(dummy) {
					root.Doodad.Tools.abortScript(0);
				});
		});
};

if (require.main === module) {
	main(process.argv.slice(2));
} else {
	module.exports = main;
};
