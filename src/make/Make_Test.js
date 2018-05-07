//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2015-2018 Claude Petit, licensed under Apache License version 2.0\n", true)
	// doodad-js - Object-oriented programming framework
	// File: Make_Test.js - Make extension
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
//! END_REPLACE()


//! IF_SET("mjs")
	//! INJECT("import {default as nodeChildProcess} from 'child_process';");

//! ELSE()
	"use strict";

	const nodeChildProcess = require('child_process');
//! END_IF()

const nodeChildProcessSpawn = nodeChildProcess.spawn;

exports.add = function add(modules) {
	modules = (modules || {});
	modules['Make.Test'] = {
		version: /*! REPLACE_BY(TO_SOURCE(VERSION(MANIFEST("name")))) */ null /*! END_REPLACE()*/,
		//dependencies: [],

		create: function create(root, /*optional*/_options, _shared) {
			//===================================
			// Get namespaces
			//===================================

			const doodad = root.Doodad,
				types = doodad.Types,
				tools = doodad.Tools,
				files = tools.Files,
				//modules = doodad.Modules,
				make = root.Make,
				makeTest = make.Test;

			//===================================
			// Natives
			//===================================

			//tools.complete(_shared.Natives, {
			//});

			//===================================
			// Internal
			//===================================

			//const __Internal__ = {
			//};


			makeTest.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Run',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						const TEST_PKG = "@doodad-js/test";

						const Promise = types.getPromise();

						const taskData = this.taskData;

						const packageDir = taskData.packageDir;

						const locate = function _locate(dummy) {
							return Promise.create(function locatePromise(resolve, reject) {
								tools.log(tools.LogLevels.Info, "Locating the test application...");

								const options = {
									shell: false,
									env: tools.extend({}, process.env, {NODE_ENV: 'development'}),
									stdio: [0, 'pipe', 2],
									cwd: packageDir.toApiString(),
								};

								const cp = nodeChildProcessSpawn("node", ['-e', "console.log(require.resolve('" + TEST_PKG + "'))"], options);

								cp.on('exit', function cpOnExit(code, signal) {
									if (code !== 0) {
										reject(new types.Error("Failed to locate package '~0~'.", [TEST_PKG]));
									} else {
										let location = '';
										if (cp.stdout) {
											let chunk = cp.stdout.read();
											while (chunk) {
												location += chunk.toString('utf-8');
												chunk = cp.stdout.read();
											};
										};
										resolve(location);
									};
								});
							});
						};

						const install = function _install(dummy) {
							return Promise.create(function installPromise(resolve, reject) {
								tools.log(tools.LogLevels.Info, "Installing the test application...");

								const options = {
									shell: true,
									env: tools.extend({}, process.env, {NODE_ENV: 'development'}),
									stdio: [0, 1, 2],
									cwd: packageDir.toApiString(),
								};

								const cp = nodeChildProcessSpawn("npm", ['install', TEST_PKG, '--no-save'], options);

								cp.on('exit', function cpOnExit(code, signal) {
									if (code !== 0) {
										reject(new types.Error("'NPM' exited with code '~0~'.", [code]));
									} else {
										resolve();
									};
								});
							});
						};

						const launch = function _launch(pkgLocation) {
							return Promise.create(function launchPromise(resolve, reject) {
								tools.log(tools.LogLevels.Info, "Launching the test application...");

								//const appDir = files.Path.parse(modules.resolve(TEST_PKG)).set({file: ''});
								const appDir = files.Path.parse(pkgLocation).set({file: ''});

								const options = {
									shell: true,
									env: tools.extend({}, process.env),
									stdio: [0, 1, 2],
									cwd: appDir.toApiString(),
								};

								const cp = nodeChildProcessSpawn("npm", ['run', 'test'], options);

								cp.on('exit', function cpOnExit(code, signal) {
									if (code !== 0) {
										reject(new types.Error("'NPM' exited with code '~0~'.", [code]));
									} else {
										resolve();
									};
								});
							});
						};

						return locate()
							.catch(function catchLocate(err) {
								return install()
									.then(locate);
							})
							.then(function(pkgLocation) {
								return launch(pkgLocation);
							})
							.then(function thenNothing(dummy) {
								// Returns nothing
							});
					}),
				}));


			//===================================
			// Init
			//===================================
			//return function init(/*optional*/options) {
			//};
		},
	};
	return modules;
};

//! END_MODULE()
