//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n", true)
// doodad-js - Object-oriented programming framework
// File: _Make.js - Make module
// Project home: https://github.com/doodadjs/
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
//! END_REPLACE()

module.exports = {
	add: function add(DD_MODULES) {
		DD_MODULES = (DD_MODULES || {});
		DD_MODULES['Make'] = {
			version: /*! REPLACE_BY(TO_SOURCE(VERSION(MANIFEST("name")))) */ null /*! END_REPLACE()*/,
			namespaces: ['Folder', 'File', 'File.Spawn', 'Generate', 'Browserify', 'Webpack', 'Modules', 'Update'],
			
			create: function create(root, /*optional*/_options, _shared) {
				"use strict";

				const doodad = root.Doodad,
					tools = doodad.Tools,
					files = tools.Files,
					config = tools.Config,
					types = doodad.Types,
					modules = doodad.Modules,
					nodejs = doodad.NodeJs,
					nodejsIO = nodejs.IO,
					nodejsIOInterfaces = nodejsIO.Interfaces,
					namespaces = doodad.Namespaces,
					extenders = doodad.Extenders,
					io = doodad.IO,
					minifiers = io.Minifiers,
					safeEval = tools.SafeEval,
					make = root.Make,
					folder = make.Folder,
					file = make.File,
					spawn = file.Spawn,
					generate = make.Generate,
					browserify = make.Browserify,
					webpack = make.Webpack,
					makeModules = make.Modules,
					update = make.Update,
					
					Promise = types.getPromise(),
					
					nodeFs = require('fs'),
					nodeChildProcess = require('child_process'),
					Module = require('module').Module;
					
				let nodeBrowserify = null;
				try {
					nodeBrowserify = require('browserify');
				} catch(ex) {
				};
				
				let nodeWebpack = null;
				try {
					nodeWebpack = require('webpack');
				} catch(ex) {
				};
					
				types.complete(_shared.Natives, {
					arraySplice: global.Array.prototype.splice,
					
					// "getBuiltFileName"
					stringReplace: String.prototype.replace,
				});
					
					
				const __Internal__ = {
					searchJsExtRegExp: /([.]js)$/,
					uuids: types.nullObject(),
					uuidKeys: types.nullObject(),
				};
					
					
					
				const __options__ = types.extend({
				  unixDataPath: "/var/lib/",
				  unixLibPath: "/usr/local/lib/",
				}, _options);

				//__options__. = types.to....(__options__.);

				types.freezeObject(__options__);

				make.ADD('getOptions', function() {
					return __options__;
				});
				
				
				__Internal__.getManifest = function getManifest(pkg) {
					return require(pkg.split('/', 2)[0] + '/package.json');
				};

				__Internal__.getMakeManifest = function getMakeManifest(pkg) {
					return require(pkg.split('/', 2)[0] + '/make.json');
				};

				__Internal__.getVersion = function getVersion(pkg) {
					let manifest = null;
					try {
						manifest = __Internal__.getMakeManifest(pkg);
					} catch(ex) {
						manifest = __Internal__.getManifest(pkg);
					};
					return manifest.version + (manifest.stage || 'd');
				};

				
				__Internal__.JsMinifier = doodad.REGISTER(minifiers.Javascript.$extend({
					$TYPE_NAME: '__JsMinifier',
					
					__knownDirectives: {
						VERSION: function VERSION(pkg) {
							if (this.memorize <= 0) {
								return __Internal__.getVersion(pkg);
							};
						},
						MANIFEST: function MANIFEST(key) {
							if (this.memorize <= 0) {
								return safeEval.eval(key, this.options.taskData.manifest);
							};
						},
						MAKE_MANIFEST: function MAKE_MANIFEST(key) {
							if (this.memorize <= 0) {
								return safeEval.eval(key, this.options.taskData.makeManifest);
							};
						},
						BEGIN_MODULE: function() {
							this.pushDirective({
								name: 'MODULE',
							});
							if (this.memorize <= 0) {
								if (!types.has(this.variables, 'serverSide')) {
									this.directives.INJECT("; " +
										"(function(global, module, DD_MODULES) {"
									);
								};
							};
						},
						END_MODULE: function() {
							const block = this.popDirective();
							if (!block || (block.name !== 'MODULE')) {
								throw new types.Error("Invalid 'END_MODULE' directive.");
							};
							if (this.memorize <= 0) {
								if (!types.has(this.variables, 'serverSide')) {
									this.directives.INJECT("; " +
											"module.exports.add(DD_MODULES)" + "; " +
										"}).call(window, window, {exports: {}}, (typeof DD_MODULES === 'undefined' ? window.DD_MODULES = {} : DD_MODULES))" + "; "
									);
								};
							};
						},
						INCLUDE: function(file, /*optional*/encoding, /*optional*/raw) {
							const block = this.getDirective();
							if (!block.remove && (this.memorize <= 0)) {
								// TODO: Read file async (if possible !)
								if (types.isString(file)) {
									file = this.options.taskData.parseVariables(file, { isPath: true });
								};
								let content = nodeFs.readFileSync(file.toString(), encoding || this.options.encoding);
								if (file.extension === 'json') {
									content = this.directives.TO_SOURCE(JSON.parse(content), Infinity);
									raw = true;
								} else if (raw) {
									this.directives.INJECT(";", true); // add a separator
								};
								this.directives.INJECT(content, raw);
							};
						},
						UUID: function(/*optional*/key) {
							key = types.toString(key);
							if (key) {
								if (key in __Internal__.uuids) {
									return __Internal__.uuids[key];
								} else {
									var count = 5,
										ok = false,
										uuid;
									while (count-- > 0) {
										uuid = tools.generateUUID();
										if (!(uuid in __Internal__.uuidKeys) || (__Internal__.uuidKeys[uuid] === key)) {
											ok = true;
											break;
										};
									};
									if (!ok) {
										throw new types.Error("Failed to generate a new unique UUID for key '~0~'.", [key]);
									};
									__Internal__.uuids[key] = uuid;
									__Internal__.uuidKeys[uuid] = key;
									return uuid;
								};
							} else {
								return tools.generateUUID();
							};
						},
					},
				})),
				
					
				make.REGISTER(doodad.BASE(doodad.Object.$extend(
				{
					$TYPE_NAME: 'Operation',
					
					taskData: doodad.PUBLIC( null ),
					
					execute: doodad.PUBLIC(doodad.ASYNC(doodad.MUST_OVERRIDE())), // function execute(command, item, /*optional*/options)
				})));
					
					
					
				make.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Task',

					createTaskData: doodad.PROTECTED(function createTaskData() {
						return {
							init: function init(item, /*optional*/options) {
								const extendFn = function(result, val, key, extend) {
									if (types.isArray(val)) {
										result[key] = types.unique(result[key], val);
									} else if (types.isObject(val)) {
										var resultVal = result[key];
										if (types.isNothing(resultVal)) {
											result[key] = extend({}, val);
										} else if (types.isObjectLike(resultVal)) {
											extend(resultVal, val);
										} else {
											result[key] = val;
										};
									} else {
										result[key] = val;
									};
								};

								this.packageDir = files.Path.parse(types.get(item, 'source', process.cwd()));
							
								let manifestTemplate = types.get(item, 'manifestTemplate');
								if (types.isString(manifestTemplate)) {
									manifestTemplate = this.parseVariables(manifestTemplate, { isPath: true });
								};
								if (!manifestTemplate) {
									manifestTemplate = files.Path.parse(module.filename).set({file: ''}).combine('res/package.templ.json', {os: 'linux'});
								};

								const templ = require(manifestTemplate.toString());
								this.manifestPath = this.combineWithPackageDir('./package.json').toString();					
								this.manifest = require(this.manifestPath);
								this.manifest = types.depthExtend(extendFn, {}, templ, this.manifest);
								delete this.manifest['//']; // remove comments
								
								const makeTempl = require(files.Path.parse(module.filename).set({file: ''}).combine('res/make.templ.json', {os: 'linux'}).toString());
								this.makeManifest = require(this.combineWithPackageDir('./make.json').toString());
								this.makeManifest = types.depthExtend(extendFn, {}, makeTempl, this.makeManifest);
								delete this.makeManifest['//']; // remove comments
								
								this.sourceDir = this.combineWithPackageDir(types.get(this.makeManifest, 'sourceDir', './src'));
								this.buildDir = this.combineWithPackageDir(types.get(this.makeManifest, 'buildDir', './build'));
								this.installDir = this.combineWithPackageDir(types.get(this.makeManifest, 'installDir', './dist'));
								this.browserifyDir = this.combineWithPackageDir(types.get(this.makeManifest, 'browserifyDir', './browserify'));
							},
							
							combineWithPackageDir: function combineWithPackageDir(path, options) {
								path = files.Path.parse(path, {noEscapes: true, dirChar: ['/', '\\'], isRelative: null}).set({
									noEscapes: false,
									dirChar: null,
								});
								if (path.isRelative) {
									path = this.packageDir.combine(path);
								};
								return path;
							},
							
							parseVariables: function parseVariables(val, /*optional*/options) {
								function solvePath(path, /*optional*/os) {
									if (types.isString(path)) {
										return files.Path.parse(path, {
											os: (os || 'linux'),
											dirChar: null,
											shell: 'api',
											noEscapes: true,
											isRelative: null, // auto-detect
										});
									} else {
										return path;
									};
								};
								
								const isPath = types.get(options, 'isPath', false);

								let path = val;
								if (isPath) {
									if (!(path instanceof files.Path)) {
										path = solvePath(val);
									};
									path = path.toArray();
								} else {
									path = [types.toString(path)];
								};
								
								const os = tools.getOS();

								if (path.length && (path[0][0] === '~')) {
									const resolved = Module._resolveFilename(path[0].slice(1) + '/package.json', (require.main || module.parent), true);
									path = solvePath(resolved, os.type).set({file: null}).combine(null, {file: path.slice(1)});
									path = path.toArray();
								};

								for (var i = 0; i < path.length; ) {
									let str = path[i],
										start = str.indexOf('%'),
										end = str.indexOf('%', start + 1),
										result = ((start > 0) ? str.slice(0, start) : ''),
										changed = (start >= 0);

									while ((start >= 0) && (end >= 0)) {
										const name = str.slice(start, end + 1),
											nameLc = name.toLowerCase();
										let value;
										if (nameLc === '%packagename%') {
											if (this.manifest && this.manifest.name) {
												value = this.manifest.name;
											} else {
												throw new types.Error("Package name not specified.");
											};
										} else if (nameLc === '%packageversion%') {
											if (this.manifest && this.manifest.version) {
												value = this.manifest.version;
											} else {
												throw new types.Error("Package version not specified.");
											};
										} else if (nameLc === '%packagedir%') {
											if (this.packageDir) {
												value = solvePath(this.packageDir);
											} else {
												throw new types.Error("Package directory not specified.");
											};
										} else if (nameLc === '%sourcedir%') {
											if (this.sourceDir) {
												value = solvePath(this.sourceDir);
											} else {
												throw new types.Error("Source directory not specified.");
											};
										} else if (nameLc === '%builddir%') {
											if (this.buildDir) {
												value = solvePath(this.buildDir);
											} else {
												throw new types.Error("Build directory not specified.");
											};
										} else if (nameLc === '%installdir%') {
											if (this.installDir) {
												value = solvePath(this.installDir);
											} else {
												throw new types.Error("Installation directory not specified.");
											};
										} else if (nameLc === '%browserifydir%') {
											if (this.browserifyDir) {
												value = solvePath(this.browserifyDir);
											} else {
												throw new types.Error("Browserify directory not specified.");
											};
										} else if (nameLc === '%programdata%') {
											if (os.type === 'windows') {
												value = solvePath(process.env.programdata, os.type);
											} else {
												// There is no environment variable for this purpose under Unix-like systems
												// So I use "package.json"'s "config" section.
												value = solvePath(__options__.unixDataPath || "/var/lib/", os.type);
											};
										} else if (nameLc === '%programfiles%') {
											if (os.type === 'windows') {
												value = solvePath(process.env.programfiles, os.type);
											} else {
												// There is no environment variable for this purpose under Unix-like systems
												// So I use "package.json"'s "config" section.
												value = solvePath(__options__.unixLibPath || "/usr/local/lib/", os.type);
											};
										} else if ((nameLc === '%appdata%') || (nameLc === '%localappdata%')) {
											if (os.type === 'windows') {
												value = solvePath(process.env.appdata || process.env.localappdata, os.type);
											} else {
												value = solvePath(process.env.HOME, os.type);
											};
										//...
										} else {
											const tmp = name.slice(1, -1);
											if (!types.has(process.env, tmp)) {
												throw new types.Error("Invalid environment variable name: '~0~'.", [tmp]);
											};
											value = process.env[tmp];
											if (value.indexOf(os.dirChar) >= 0) {
												value = solvePath(value, os.type);
											};
										};
										
										if (value instanceof files.Path) {
											if ((i > 0) && !value.isRelative) {
												throw types.Error("Path in '~0~' can't be inserted because it is an absolute path.", [name]);
											};
											result += value.toString({
												os: os.type,
												dirChar: os.dirChar,
												shell: 'api',
												noEscapes: true,
											});
										} else {
											result += types.toString(value);
										};
										
										start = str.indexOf('%', end + 1);
										if (start >= 0) {
											result += str.slice(end + 1, start);
											end = str.indexOf('%', start + 1);
										} else {
											result += str.slice(end + 1);
											end = -1;
										};
									};
									
									if (changed) {
										if (isPath) {
											path.splice.apply(path, types.append([i, 1], solvePath(result, os.type).toArray()));
										} else {
											path[i] = result;
										};
									} else {
										i++;
									};
								};
								
								if (isPath) {
									return files.Path.parse(path);
								} else {
									return path.join('');
								};
							},
						};
					}),
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						command = types.get(item, 'name') || command;

						console.info('Starting task "' + command + '"...');
						
						if (!this.taskData || types.get(item, 'source')) {
							this.taskData = this.createTaskData();
							this.taskData.init(item, options);
						};

						const task = types.get(this.taskData.makeManifest.tasks, command);

						const proceed = function proceed(index) {
							if (index < task.operations.length) {
								const op = task.operations[index];
								
								let obj = op['class'];
									
								if (types.isString(obj)) {
									obj = namespaces.get(obj);
								};
								
								if (!types._implements(obj, make.Operation)) {
									throw new types.Error("Invalid class '~0~'.", [obj]);
								};

								if (types.isType(obj)) {
									obj = new obj();
								};

								obj.taskData = this.taskData;
								
								let promise = obj.execute(command, op, options);
								
								if (!types.isPromise(promise)) {
									promise = Promise.resolve(promise);
								};
								
								return promise
									.then(function(newOps) {
										if (!types.isNothing(newOps)) {
											if (!types.isArray(newOps)) {
												newOps = [newOps];
											};
											_shared.Natives.arraySplice.apply(task.operations, types.append([index + 1, 0], newOps));
										};
										return proceed.call(this, ++index);
									}, null, this);
							};
						};
						
						return proceed.call(this, 0);
					}),
				}));
					
					
				makeModules.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Load',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						console.info('Loading required modules...');
						return modules.load(types.get(item, 'modules'), options)
							.then(function(result) {
								// Returns nothing
							});
					}),
				}));

				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Create',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = this.taskData.parseVariables(dest, {isPath: true});
						};
						console.info('Creating folder "' + dest + '"...');
						return files.mkdir(dest, {async: true})
							.then(function() {
								// Returns nothing
							});
					}),
				}));

				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Copy',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = this.taskData.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = this.taskData.parseVariables(dest, { isPath: true });
						};
						console.info('Copying folder "' + source + '" to "' + dest + '"...');
						return files.mkdir(dest, {makeParents: true, async: true})
							.then(function() {
								return files.copy(source, dest, {recursive: true, override: true, async: true});
							})
							.then(function() {
								// Returns nothing
							});
					}),
				}));

				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Delete',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = this.taskData.parseVariables(dest, { isPath: true });
						};
						console.info('Deleting folder "' + dest + '"...');
						return files.rmdir(dest, {force: true, async: true})
							.then(function() {
								// Returns nothing
							});
					}),
				}));

				
				
				file.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Copy',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = this.taskData.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = this.taskData.parseVariables(dest, { isPath: true });
						};
						console.info('Copying file "' + source + '" to "' + dest + '"...');
						return files.mkdir(dest.set({file: null}), {makeParents: true, async: true})
							.then(function() {
								return files.copy(source, dest, {override: true, async: true});
							})
							.then(function() {
								// Returns nothing
							});
					}),
				}));
				
				file.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Merge',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						const taskData = this.taskData;
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = taskData.parseVariables(dest, { isPath: true });
						};
						let source = item.source;
						if (types.isArrayLike(source)) {
							source = types.toArray(source);
						} else {
							source = [source];
						};
						const separator = item.separator;
						console.info('Merging files to "' + dest + '"...');
						const createFile = function() {
							return nodeFs.createWriteStream(dest.toString({shell: 'api'}));
						};
						const loopMerge = function(outputStream) {
							if (source.length) {
								let src = source.shift();
								if (types.isString(src)) {
									src = taskData.parseVariables(src, { isPath: true });
								};
								src = src.toString({shell: 'api'});
								console.info("    " + src);
								return Promise.create(function pipeInputPromise(resolve, reject) {
										const inputStream = nodeFs.createReadStream(src);
										inputStream
											.on('error', reject)
											.on('end', resolve)
											.pipe(outputStream, {end: false});
									})
									.then(function() {
										if (source.length) {
											return Promise.resolve(outputStream)
												.then(writeSeparator)
												.then(loopMerge);
										} else {
											return Promise.resolve(outputStream)
												.then(loopMerge);
										};
									});
							};
							return outputStream;
						};
						const writeSeparator = function(outputStream) {
							if (separator) {
								return Promise.create(function writePromise(resolve, reject) {
									outputStream.write(separator, function(err, result) {
										if (err) {
											reject(err);
										} else {
											resolve(outputStream);
										};
									});
								});
							};
							return outputStream;
						};
						const closeFile = function(outputStream) {
							outputStream.end();
						};
						return files.mkdir(dest.set({file: null}), {makeParents: true, async: true})
							.then(createFile)
							.then(loopMerge)
							.then(closeFile)
							.then(function() {
								// Returns nothing
							});
					}),
				}));
				
				file.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Javascript',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = this.taskData.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = this.taskData.parseVariables(dest, { isPath: true });
						};
						console.info('Minifying file "' + source + '" to "' + dest + '"...');
						const variables = types.extend({
							task: command,
						}, types.get(item, 'variables'), types.get(options, 'variables'));
						const taskData = this.taskData;
						return files.mkdir(dest.set({file: null}), {makeParents: true, async: true})
							.then(function() {
								const jsStream = new __Internal__.JsMinifier({taskData: taskData, flushMode: 'half', runDirectives: types.get(item, 'runDirectives'), keepComments: types.get(item, 'keepComments'), keepSpaces: types.get(item, 'keepSpaces')});
								if (variables) {
									tools.forEach(variables, function(value, name) {
										jsStream.define(name, value);
									});
								};
								return Promise.create(function pipePromise(resolve, reject) {
										const inputStream = nodeFs.createReadStream(source.toString({shell: 'api'}));
										const jsStreamTransform = jsStream.getInterface(nodejsIOInterfaces.ITransform);
										const outputStream = nodeFs.createWriteStream(dest.toString({shell: 'api'}));
										outputStream.on('close', resolve);
										outputStream.on('error', reject);
										inputStream
											.pipe(jsStreamTransform)
											.pipe(outputStream);
									})
									.nodeify(function(err, result) {
										try {
											jsStream.stopListening();
											jsStream.destroy();
										} catch(o) {
										};
										
										if (err) {
											throw err;
										} else {
											return result;
										};
									});
							})
							.then(function() {
								// Returns nothing
							});
					}),
				}));

				
				
				spawn.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Node',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = this.taskData.parseVariables(source, { isPath: true });
						};
						return Promise.create(function nodeJsForkPromise(resolve, reject) {
								const cp = nodejs.fork(source, item.args, {stdio: ['pipe', 1, 2]});
								cp.on('close', function(status) {
									if (status) {
										reject(new types.Error("Process exited with code '~0~'.", [result.status]));
									} else {
										resolve();
									};
								});
							})
							.then(function() {
								// Returns nothing
							});
					}),
				}));

				
				
				
				generate.REGISTER(make.Operation.$extend({
					$TYPE_NAME: 'Configuration',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let destination = item.destination;
						if (types.isString(destination)) {
							destination = this.taskData.parseVariables(destination, { isPath: true });
						};
						const self = this;
						return files.mkdir(destination.set({file: null}), {makeParents: true, async: true})
							.then(function() {
								console.info('Saving configuration to "' + destination + '"...');
								return require('npm-package-config').list(self.taskData.manifest.name, {beautify: true, async: true})
									.then(function(config) {
										delete config['package'];
										return Promise.create(function nodeFsWriteFilePromise(resolve, reject) {
											nodeFs.writeFile(destination.toString({shell: 'api'}), JSON.stringify(config), {encoding: 'utf-8'}, function(ex) {
												if (ex) {
													reject(ex);
												} else {
													resolve();
												};
											});
										});
									});
							})
							.then(function() {
								// Returns nothing
							});
					}),
				}));

				
				__Internal__.getBuiltFileName = function getBuiltFileName(fileName) {
					return _shared.Natives.stringReplace.call(fileName, __Internal__.searchJsExtRegExp, ".min.js");
				};
				

				generate.REGISTER(make.Operation.$extend({
					$TYPE_NAME: 'Package',

					execute_make: doodad.PROTECTED(function execute_make(command, item, /*optional*/options) {
						let ops = [];
						
						const taskData = this.taskData;
						
						let indexTemplate = types.get(item, 'indexTemplate');
						if (types.isString(indexTemplate)) {
							indexTemplate = taskData.parseVariables(indexTemplate, { isPath: true });
						};
						if (!indexTemplate) {
							indexTemplate = files.Path.parse(module.filename).set({file: ''}).combine('res/index.templ.js', {os: 'linux'});
						};
						
						let testsTemplate = types.get(item, 'testsTemplate');
						if (types.isString(testsTemplate)) {
							testsTemplate = taskData.parseVariables(testsTemplate, { isPath: true });
						};
						if (!testsTemplate) {
							testsTemplate = files.Path.parse(module.filename).set({file: ''}).combine('res/tests.templ.js', {os: 'linux'});
						};
						
						// Get server dependencies
						const dependencies = tools.filter(taskData.makeManifest.dependencies, function(dep) {
							return dep.server;
						});
						
						// Get server modules
						const modules = tools.filter(taskData.makeManifest.modules, function(mod) {
							return mod.server;
						});
						
						// Get server resources
						const resources = tools.filter(taskData.makeManifest.resources, function(res) {
							return res.server;
						});
						
						// Build modules
						ops = types.append(ops, tools.map(modules, function(mod) {
							return {
								'class': file.Javascript,
								source: '%SOURCEDIR%/' + mod.src,
								destination: '%BUILDDIR%/' + __Internal__.getBuiltFileName(mod.src),
								runDirectives: true,
								variables: {
									serverSide: true,
								},
							};
						}));
						
						// Build index
						if (!types.get(item, 'noIndex', false)) {
							ops.push(
								{
									'class': file.Javascript,
									source: indexTemplate,
									destination: '%PACKAGEDIR%/index.js',
									runDirectives: true,
									variables: {
										serverSide: true,
										dependencies: tools.map(tools.filter(dependencies, function(dep) {
												return !dep.test;
											}), function(dep) {
												return {
													name: dep.name,
													version: __Internal__.getVersion(dep.name.split('/', 2)[0]),
													optional: dep.optional || false,
												};
											}),
										modules: tools.map(tools.filter(modules, function(mod) {
												return !mod.test;
											}), function(mod) {
												return types.extend({}, mod, {
													dest: taskData.parseVariables('%BUILDDIR%/' + __Internal__.getBuiltFileName(mod.src), { isPath: true }).relative(taskData.packageDir).toString({os: 'linux'}),
													optional: types.get(mod, 'optional', false),
												});
											}),
										modulesSrc: tools.map(tools.filter(modules, function(mod) {
												return !mod.test;
											}), function(mod) {
												return types.extend({}, mod, {
													dest: taskData.parseVariables('%SOURCEDIR%/' + mod.src, { isPath: true }).relative(taskData.packageDir).toString({os: 'linux'}),
													optional: types.get(mod, 'optional', false),
												});
											}),
									},
								}
							);
						};

						ops.push(
							{
								'class': file.Javascript,
								source: testsTemplate,
								destination: '%PACKAGEDIR%/test/tests.js',
								runDirectives: true,
								variables: {
									serverSide: true,
									debug: true,
									dependencies: tools.map(types.prepend(tools.filter(dependencies, function(dep) {
											return dep.test;
										}), [{name: 'doodad-js-test'}]), function(dep) {
											return {
												name: dep.name,
												version: __Internal__.getVersion(dep.name.split('/', 2)[0]),
												optional: dep.optional || false,
											};
										}),
									modules: tools.map(tools.filter(modules, function(mod) {
											return mod.test;
										}), function(mod) {
											return types.extend({}, mod, {
												dest: taskData.parseVariables('%BUILDDIR%/' + __Internal__.getBuiltFileName(mod.src), { isPath: true }).relative(taskData.packageDir).toString({os: 'linux'}),
												optional: types.get(mod, 'optional', false),
											});
										}),
									modulesSrc: tools.map(tools.filter(modules, function(mod) {
											return mod.test;
										}), function(mod) {
											return types.extend({}, mod, {
												dest: taskData.parseVariables('%SOURCEDIR%/' + mod.src, { isPath: true }).relative(taskData.packageDir).toString({os: 'linux'}),
												optional: types.get(mod, 'optional', false),
											});
										}),
								},
							}
						);
						
						// Copy resources
						ops = types.append(ops, tools.map(resources, function(res) {
							return {
								'class': folder.Copy,
								source: '%SOURCEDIR%/' + res.src,
								destination: '%BUILDDIR%/' + res.src,
							};
						}));
						
						// Copy license
						ops.push( 
							{
								'class': file.Copy,
								source: '%PACKAGEDIR%/LICENSE',
								destination: '%BUILDDIR%/LICENSE',
							}
						);

						// Generate config file
						ops.push( 
							{
								'class': generate.Configuration,
								destination: '%PACKAGEDIR%/config.json',
							}
						);

						// Update manifest
						ops.push( 
							{
								'class': update.Manifest,
							}
						);

						return ops;
					}),
					
					execute_install: doodad.PROTECTED(function execute_install(command, item, /*optional*/options) {
						let ops = [];

						const taskData = this.taskData;
						
						let indexTemplate = types.get(item, 'indexTemplate');
						if (types.isString(indexTemplate)) {
							indexTemplate = taskData.parseVariables(indexTemplate, { isPath: true });
						};
						if (!indexTemplate) {
							indexTemplate = files.Path.parse(module.filename).set({file: ''}).combine('res/package.templ.js', {os: 'linux'});
						};
						
						let testsTemplate = types.get(item, 'testsTemplate');
						if (types.isString(testsTemplate)) {
							testsTemplate = taskData.parseVariables(testsTemplate, { isPath: true });
						};
						if (!testsTemplate) {
							testsTemplate = files.Path.parse(module.filename).set({file: ''}).combine('res/tests.templ.js', {os: 'linux'});
						};
						
						// Get client dependencies
						const dependencies = tools.filter(taskData.makeManifest.dependencies, function(dep) {
							return dep.client;
						});
						
						// Get client modules
						const modules = tools.filter(taskData.makeManifest.modules, function(mod) {
							return mod.client;
						});
						
						// Get client resources
						const resources = tools.filter(taskData.makeManifest.resources, function(res) {
							return res.client;
						});
						
						// Build modules source
						ops = types.append(ops, tools.map(modules, function(mod) {
							return {
								'class': file.Javascript,
								source: '%SOURCEDIR%/' + mod.src,
								destination: '%INSTALLDIR%/%PACKAGENAME%/' + mod.src,
								runDirectives: true,
								keepComments: true,
								keepSpaces: true,
								variables: {
									debug: true,
								},
							};
						}));
						
						// Build modules
						ops = types.append(ops, tools.map(modules, function(mod) {
							return {
								'class': file.Javascript,
								source: '%SOURCEDIR%/' + mod.src,
								destination: '%INSTALLDIR%/%PACKAGENAME%/' + __Internal__.getBuiltFileName(mod.src),
								runDirectives: true,
							};
						}));
						
						// Build tests
						ops.push(
							{
								'class': file.Javascript,
								source: testsTemplate,
								destination: '%INSTALLDIR%/%PACKAGENAME%/tests.js',
								runDirectives: true,
								variables: {
									debug: true,
									dependencies: tools.map(types.prepend(tools.filter(dependencies, function(dep) {
											return dep.test;
										}), [{name: 'doodad-js-test'}]), function(dep) {
											return {
												name: dep.name,
												version: __Internal__.getVersion(dep.name.split('/', 2)[0]),
												optional: dep.optional || false,
											};
										}),
									modules: tools.map(tools.filter(modules, function(mod) {
											return mod.test;
										}), function(mod) {
											return types.extend({}, mod, {
												dest: __Internal__.getBuiltFileName(mod.src),
											});
										}),
									modulesSrc: tools.map(tools.filter(modules, function(mod) {
											return mod.test;
										}), function(mod) {
											return types.extend({}, mod, {
												dest: mod.src,
											});
										}),
								},
							}
						);
						
						// Copy resources
						ops = types.append(ops, tools.map(resources, function(res) {
							return {
								'class': folder.Copy,
								source: '%SOURCEDIR%/' + res.src,
								destination: '%INSTALLDIR%/%PACKAGENAME%/' + res.src,
							};
						}));
						
						// Generate ocnfig file
						ops.push( 
							{
								'class': generate.Configuration,
								destination: '%INSTALLDIR%/%PACKAGENAME%/config.json',
							}
						);

						// Create bundle from source
						ops.push( 
							{
								'class': file.Merge,
								source: tools.map(tools.filter(modules, function(mod) {
										return !mod.test;
									}), function(mod) {
										return '%INSTALLDIR%/%PACKAGENAME%/' + mod.src;
									}),
								destination: '%INSTALLDIR%/%PACKAGENAME%/bundle_debug.js',
								separator: ';',
							}
						);

						// Build index (debug)
						if (!types.get(item, 'noIndex', false)) {
							ops.push(
								{
									'class': file.Javascript,
									source: indexTemplate,
									destination: '%INSTALLDIR%/%PACKAGENAME%/%PACKAGENAME%_debug.js',
									runDirectives: true,
									variables: {
										config: '%INSTALLDIR%/%PACKAGENAME%/config.json',
										bundle: '%INSTALLDIR%/%PACKAGENAME%/bundle_debug.js',
										dependencies: tools.map(tools.filter(dependencies, function(dep) {
												return !dep.test;
											}), function(dep) {
												return {
													name: dep.name,
													version: __Internal__.getVersion(dep.name.split('/', 2)[0]),
													optional: dep.optional || false,
												};
											}),
									},
								}
							);
						};
						
						// Create tests bundle from source
						ops.push( 
							{
								'class': file.Merge,
								source: tools.map(tools.filter(modules, function(mod) {
										return mod.test;
									}), function(mod) {
										return '%INSTALLDIR%/%PACKAGENAME%/' + mod.src;
									}),
								destination: '%INSTALLDIR%/%PACKAGENAME%/tests_bundle.js',
								separator: ';',
							}
						);
						ops.push(
							{
								'class': file.Javascript,
								source: testsTemplate,
								destination: '%INSTALLDIR%/%PACKAGENAME%/%PACKAGENAME%_tests.js',
								runDirectives: true,
								variables: {
									bundle: '%INSTALLDIR%/%PACKAGENAME%/tests_bundle.js',
									dependencies: tools.map(types.prepend(tools.filter(dependencies, function(dep) {
											return dep.test;
										}), [{name: 'doodad-js-test'}]), function(dep) {
											return {
												name: dep.name,
												version: __Internal__.getVersion(dep.name.split('/', 2)[0]),
												optional: dep.optional || false,
											};
										}),
								},
							}
						);
						
						// Create bundle from build
						ops.push( 
							{
								'class': file.Merge,
								source: tools.map(tools.filter(modules, function(mod) {
										return !mod.test;
									}), function(mod) {
										return '%INSTALLDIR%/%PACKAGENAME%/' + __Internal__.getBuiltFileName(mod.src);
									}),
								destination: '%INSTALLDIR%/%PACKAGENAME%/bundle.js',
								separator: ';',
							}
						);

						// Build index (build)
						if (!types.get(item, 'noIndex', false)) {
							ops.push( 
								{
									'class': file.Javascript,
									source: indexTemplate,
									destination: '%INSTALLDIR%/%PACKAGENAME%/%PACKAGENAME%.js',
									runDirectives: true,
									variables: {
										config: '%INSTALLDIR%/%PACKAGENAME%/config.json',
										bundle: '%INSTALLDIR%/%PACKAGENAME%/bundle.js',
										dependencies: tools.map(tools.filter(dependencies, function(dep) {
												return !dep.test;
											}), function(dep) {
												return {
													name: dep.name,
													version: __Internal__.getVersion(dep.name.split('/', 2)[0]),
													optional: dep.optional || false,
												};
											}),
									},
								}
							);
						};
						
						// Copy license file
						ops.push( 
							{
								'class': file.Copy,
								source: '%PACKAGEDIR%/LICENSE',
								destination: '%INSTALLDIR%/%PACKAGENAME%/LICENSE',
							}
						);

						return ops;
					}),
					
					execute_browserify: doodad.PROTECTED(function execute_browserify(command, item, /*optional*/options) {
						let ops = [];
						
						const taskData = this.taskData;
						
						let indexTemplate = types.get(item, 'indexTemplate');
						if (types.isString(indexTemplate)) {
							indexTemplate = taskData.parseVariables(indexTemplate, { isPath: true });
						};
						if (!indexTemplate) {
							indexTemplate = files.Path.parse(module.filename).set({file: ''}).combine('res/browserify.templ.js', {os: 'linux'});
						};
						
						// Get browserify dependencies
						const dependencies = tools.map(tools.filter(taskData.makeManifest.dependencies, function(dep) {
								return dep.browserify && !dep.test;
							}), function(dep) {
							return {
								name: dep.name,
								version: __Internal__.getVersion(dep.name.split('/', 2)[0]),
								optional: dep.optional || false,
							};
						});
						
						// Get browserify modules
						const modules = tools.filter(taskData.makeManifest.modules, function(mod) {
							return mod.browserify && !mod.test;
						});
						
						// Get browserify resources
						const resources = tools.filter(taskData.makeManifest.resources, function(res) {
							return res.browserify;
						});
						
						// Build modules
						ops = types.append(ops, tools.map(modules, function(mod) {
							return {
								'class': file.Javascript,
								source: '%SOURCEDIR%/' + mod.src,
								destination: '%BROWSERIFYDIR%/' + __Internal__.getBuiltFileName(mod.src),
								runDirectives: true,
								variables: {
									serverSide: true,
									browserify: true,
								},
							};
						}));
						
						// Generate resources files for browserify
						ops = types.append(ops, tools.map(resources, function(res, i) {
							return {
								'class': browserify.Resources,
								name: '%PACKAGENAME%/res' + i,
								namespace: res.namespace,
								source: '%SOURCEDIR%/' + res.src,
								destination: "%BROWSERIFYDIR%/" + res.src,
								resourcesFile: 'resources.js',
								resourcesTemplate: types.get(item, 'resourcesTemplate'),
							}
						}));
						
						const browserifyDest = taskData.parseVariables('%BROWSERIFYDIR%', {isPath: true});

						// Build main file
						if (!types.get(item, 'noIndex', false)) {
							ops.push( 
								{
									'class': file.Javascript,
									source: indexTemplate,
									destination: '%BROWSERIFYDIR%/browserify.js',
									runDirectives: true,
									variables: {
										serverSide: true,
										browserify: true,
										dependencies: dependencies,
										modules: tools.map(modules, function(mod) {
											return types.extend({}, mod, {
												dest: taskData.parseVariables('%BROWSERIFYDIR%/' + __Internal__.getBuiltFileName(mod.src), { isPath: true }).relative(browserifyDest).toString({os: 'linux'}),
											});
										}),
										resources: tools.map(resources, function(res) {
											return taskData.parseVariables('%BROWSERIFYDIR%/' + res.src + '/resources.js', { isPath: true }).relative(browserifyDest).toString({os: 'linux'});
										}),
									},
								}
							);
						};
						
						// Build main file (debug)
						if (!types.get(item, 'noIndex', false)) {
							ops.push( 
								{
									'class': file.Javascript,
									source: indexTemplate,
									destination: '%BROWSERIFYDIR%/browserify_debug.js',
									runDirectives: true,
									variables: {
										serverSide: true,
										browserify: true,
										debug: true,
										dependencies: dependencies,
										modules: tools.map(modules, function(mod) {
											return taskData.parseVariables('%SOURCEDIR%/' + mod.src, { isPath: true }).relative(browserifyDest).toString({os: 'linux'});
										}),
										resources: tools.map(resources, function(res) {
											return taskData.parseVariables('%BROWSERIFYDIR%/' + res.src + '/resources.js', { isPath: true }).relative(browserifyDest).toString({os: 'linux'});
										}),
									},
								}
							);
						};
						
						// Copy license
						ops.push( 
							{
								'class': file.Copy,
								source: '%PACKAGEDIR%/LICENSE',
								destination: "%BROWSERIFYDIR%/LICENSE",
							}
						);

						return ops;
					}),
					
					execute_webpack: doodad.PROTECTED(function execute_webpack(command, item, /*optional*/options) {
						let configTemplate = types.get(item, 'configTemplate');
						if (types.isString(configTemplate)) {
							configTemplate = this.parseVariables(configTemplate, { isPath: true });
						};
						if (!configTemplate) {
							configTemplate = files.Path.parse(module.filename).set({file: ''}).combine('res/webpack.config.templ.js', {os: 'linux'});
						};
						const configDest = this.taskData.parseVariables("%PACKAGEDIR%/webpack.config.js", { isPath: true });
						const entryFile = this.taskData.parseVariables("%BROWSERIFYDIR%/browserify.js", { isPath: true });
						console.info('Preparing webpack config file "' + configDest + '"...');
						const ops = [
							{
								'class': file.Javascript,
								source: configTemplate,
								destination: configDest,
								runDirectives: true,
								variables: {
									entry: entryFile.relative(this.taskData.packageDir).toString({os: 'linux'}),
								},
							}
						];
						return ops;
					}),

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						const method = 'execute_' + command;
						if (types.isImplemented(this, method)) {
							console.info('Generating package for "' + command + "'.");
							return this[method](command, item, options);
						} else {
							throw new types.Error("Command '~0~' not supported by '~1~'.", [command, types.getTypeName(this)]);
						};
					}),
				}));

				
				
				browserify.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Resources',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = this.taskData.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = this.taskData.parseVariables(dest, { isPath: true });
						};
						dest = dest.pushFile();
						let resFile = item.resourcesFile;
						if (types.isString(resFile)) {
							resFile = this.taskData.parseVariables(resFile, { isPath: true });
						};
						
						let resourcesTemplate = types.get(item, 'resourcesTemplate');
						if (types.isString(resourcesTemplate)) {
							resourcesTemplate = taskData.parseVariables(resourcesTemplate, { isPath: true });
						};
						if (!resourcesTemplate) {
							resourcesTemplate = files.Path.parse(module.filename).set({file: ''}).combine('res/resources.templ.js', {os: 'linux'});
						};
						
						resFile = dest.combine(resFile);
						console.info('Preparing resources for \'browserify\' from "' + source + '" to "' + dest + '"...');
						const self = this;
						function processDir(dir, index, resources) {
							if (index < dir.length) {
								const stats = dir[index];
								if (stats.isFile) {
									const resource = {
										source: stats.path,
										dest: stats.path.set({file: stats.path.file + '.res.js'}),
									};
									return files.mkdir(dest.combine(stats.path).set({file: ''}), {async: true, makeParents: true})
										.then(function() {
											return files.readFile(source.combine(resource.source), {encoding: (item.encoding || 'utf-8'), async: true});
										})
										.then(function(content) {
											return Promise.create(function nodeFsWriteFilePromise(resolve, reject) {
												nodeFs.writeFile(dest.combine(resource.dest).toString(), 
																// TODO: See how I can formulate this
																//'// This file is built from the file \'' + resource.source.file + '\' from the project package named \'' + 
																//	this.taskData.manifest.name + '\' hosted by the \'npmjs.com\' web site, ' + 
																//	'also hosted by the \'sourceforge.net\' web site under the name \'doodad-js\'.\n' + 
																'// When not mentionned otherwise, the following is Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n' + 
																'module.exports=' + types.toSource(content), (item.encoding || 'utf-8'), function(err) {
													if (err) {
														reject(err);
													} else {
														resources.push(resource);
														resolve();
													};
												});
											});
										})
										.then(function() {
											return processDir(dir, index + 1, resources);
										});
								} else {
									return processDir(dir, index + 1, resources);
								};
							} else {
								// Done
								return Promise.resolve(resources);
							};
						};
						return files.mkdir(dest, {makeParents: true, async: true})
							.then(function() {
								return files.readdir(source, {async: true, depth: Infinity, relative: true});
							})
							.then(function(dir) {
								return processDir(dir, 0, []);
							})
							.then(function(resources) {
								function buildPatterns(index, sourceAr, destStr, result) {
									const name = sourceAr[index];
									if (index < sourceAr.length - 1) {
										result[name] = buildPatterns(index + 1, sourceAr, destStr, types.get(result, name, {}));
									} else {
										result[name] = "result = require(" + types.toSource('.' + destStr) + ");";
									};
									return result;
								};
								
								function reducePatterns(level, pattern) {
									let code = "switch(tmp[" + types.toString(level + 1) + "]) {";
									tools.forEach(pattern, function(val, key) {
										code += "case " + types.toSource(key) + ": ";
										if (types.isString(val)) {
											code += val;
										} else {
											code += reducePatterns(level + 1, val);
										};
										code += "\nbreak;";
									});
									code += "default: throw new types.Error(\"Unknown resource file '~0~'.\", [path.toString()]); };"
									return code;
								};
								
								const result = tools.reduce(resources, function(result, resource) {
									const rp = files.Path.parse('/', {os: 'linux', dirChar: '/'}),
										sourceAr = rp.combine(resource.source).toArray(),
										destStr = rp.combine(resource.dest).toString({os: 'linux', dirChar: '/'});
									 // NOTE: Index "0" is "/"
									 buildPatterns(1, sourceAr, destStr, result);
									 return result;
								}, {});
								
								const resBody = reducePatterns(0, result);
								
								// Returns new operation
								return {
									'class': file.Javascript,
									source: resourcesTemplate,
									destination: resFile,
									runDirectives: true,
									variables: {
										serverSide: true,
										browserify: true,
										name: self.taskData.parseVariables(item.name),
										namespace: self.taskData.parseVariables(item.namespace),
										resources: resBody,
									},
								};
							});
					}),
				}));

				browserify.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Bundle',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = this.taskData.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = this.taskData.parseVariables(dest, { isPath: true });
						};
						console.info('Browserifying "' + source + '" to "' + dest + '"...');
						const taskData = this.taskData;
						return Promise.create(function browserifyPromise(resolve, reject) {
								if (nodeBrowserify) {
									const b = nodeBrowserify();
									if (item.fromOutside) {
										b.require(source.toString());
									} else {
										b.add(source.toString());
									};
									const outputStream = nodeFs.createWriteStream(dest.toString());
									let bundleStream = b.bundle();
									if (item.minify) {
										const jsStream = new __Internal__.JsMinifier({taskData: taskData, flushMode: 'half'});
										jsStream.listen();
										const jsStreamTransform = jsStream.getInterface(nodejsIOInterfaces.ITransform);
										bundleStream = bundleStream
											.pipe(jsStreamTransform)
											.pipe(outputStream)
									} else {
										bundleStream = bundleStream
											.pipe(outputStream)
									};
									bundleStream
										.on('finish', resolve)
										.on('error', reject);
								} else {
									throw new types.Error('Can\'t browserify "' + source + '" to "' + dest + '" because "browserify" is not installed.');
								};
							})
							.then(function() {
								// Returns nothing
							});
					}),
				}));

				
				webpack.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Bundle',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = types.get(item, 'source');
						if (types.isString(source)) {
							source = this.taskData.parseVariables(source, { isPath: true });
						};
						let dest = types.get(item, 'destination');
						if (types.isString(dest)) {
							dest = this.taskData.parseVariables(dest, { isPath: true });
						};
						console.info('Making webpack bundle from "' + source + '" to "' + dest + '"...');
						return Promise.create(function webpackPromise(resolve, reject) {
								if (nodeWebpack) {
									const config = {
										entry: source.toString(),
										output: {
											path: dest.set({file: null}).toString(),
											filename: dest.file,
										},
										module: {
											loaders: [
												{ test: /\.json$/, loader: "json" }
											],
										},
									};
									nodeWebpack(config, function(err, stats) {
										if (err) {
											reject(err);
										} else {
											resolve(stats);
										};
									});
								} else {
									throw new types.Error('Can\'t bundle "' + source + '" because "webpack" is not installed.');
								};
							})
							.then(function(stats) {
								//console.log(require('util').inspect(stats));
								// Returns nothing
							});
					}),
				}));

				
				update.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Manifest',

					DEPS_KEYS: doodad.PROTECTED(doodad.ATTRIBUTE(['dependencies', 'optionalDependencies', 'devDependencies'], extenders.UniqueArray)),

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						console.info('Updating manifest...');
						
						const taskData = this.taskData;
						
						const manifest = types.depthExtend(15, {}, taskData.manifest, {
							dependencies: tools.reduce(tools.filter(taskData.makeManifest.dependencies, function(dep) {
									return !dep.test;
								}), function(result, dep) {
									result[dep.name] = '^0.0.0'; return result;
								}, {}),
						});
						
						const getNodeVersion = function getVersion(pkg) {
							let manifest = null;
							try {
								manifest = __Internal__.getMakeManifest(pkg);
							} catch(ex) {
								manifest = __Internal__.getManifest(pkg);
							};
							let version = manifest.version;
							let stage = manifest.stage;
							stage = stage && tools.Version.parse(stage, {identifiers: namespaces.VersionIdentifiers});
							if (stage) {
								const prelease = (stage.data[0] <= -3 ? 'alpha' : stage.data[0] === -2 ? 'beta' : '');
								if (prelease) {
									version += "-" + prelease + '.' + (stage.data[3] || "0");
								};
							};
							return version;
						};

						manifest.version = getNodeVersion(manifest.name);
 
						manifest.files = types.unique(manifest.files || [],
							(taskData.makeManifest.sourceDir.isRelative ? [taskData.makeManifest.sourceDir.toString()] : undefined),
							(taskData.makeManifest.buildDir.isRelative ? [taskData.makeManifest.buildDir.toString()] : undefined),
							(taskData.makeManifest.browserifyDir.isRelative ? [taskData.makeManifest.browserifyDir.toString()] : undefined),
							(taskData.makeManifest.installDir.isRelative ? [taskData.makeManifest.installDir.toString()] : undefined)
						);
						
						for (let i = 0; i < this.DEPS_KEYS.length; i++) {
							const depKey = this.DEPS_KEYS[i];
							let deps = manifest[depKey];
							const names = types.keys(deps);
							for (let j = 0; j < names.length; j++) {
								const name = names[j];
								if (name === taskData.manifest.name) {
									delete deps[name];
								} else {
									deps[name] = deps[name][0] + getNodeVersion(name.split('/', 2)[0]);
								};
							};
						};
						
						const content = JSON.stringify(manifest, null, 4);
						
						return Promise.create(function writeManifestPromise(resolve, reject) {
								nodeFs.writeFile(taskData.manifestPath, content, {encoding: 'utf-8'}, function(err, result) {
									if (err) {
										reject(err);
									} else {
										resolve();
									};
								});
							})
							.then(function() {
								// Returns nothing
							});
					}),
				}));
				

				
				make.ADD('run', function run(command, /*optional*/options) {
					const obj = new make.Task();
					return obj.execute(command, {}, options);
				});
			},
		};
		return DD_MODULES;
	},
};
//! END_MODULE()