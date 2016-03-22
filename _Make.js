//! REPLACE_BY("// Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n")
// dOOdad - Object-oriented programming framework
// File: _Make.js - Make module
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
//! END_REPLACE()

(function() {
	var global = this;

	var exports = {};
	if (typeof process === 'object') {
		module.exports = exports;
	};
	
	exports.add = function add(DD_MODULES) {
		DD_MODULES = (DD_MODULES || {});
		DD_MODULES['Make'] = {
			type: null,
			version: '0.3.2a',
			namespaces: ['Folder', 'File', 'File.Spawn', 'Generate', 'Browserify', 'Modules'],
			dependencies: [
				'Doodad.Types', 
				'Doodad.Tools', 
				'Doodad.Tools.Files',
				'Doodad.Modules',
				'Doodad', 
				'Doodad.NodeJs', 
				'Doodad.NodeJs.IO', 
				'Doodad.Namespaces', 
				{
					name: 'Doodad.IO.Minifiers', 
					version: '0.4.0',
				},
			],
			exports: exports,
			
			create: function create(root, /*optional*/_options) {
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
					io = doodad.IO,
					minifiers = io.Minifiers,
					make = root.Make,
					folder = make.Folder,
					file = make.File,
					spawn = file.Spawn,
					generate = make.Generate,
					browserify = make.Browserify,
					makeModules = make.Modules,
					
					Promise = types.getPromise(),
					
					nodeFs = require('fs'),
					nodeChildProcess = require('child_process');
					
				let nodeBrowserify = null;
				try {
					nodeBrowserify = require('browserify');
				} catch(ex) {
				};
					
					
				const __Internal__ = {
					packageName: null,
					packageVersion: null,
					packageDir: null,
					sourceDir: null,
					buildDir: null,
					installDir: null,
					makeData: null,
				};
					
					
					
				//__Internal__.oldSetOptions = make.setOptions;
				//make.setOptions = function setOptions(/*paramarray*/) {
				//	var options = __Internal__.oldSetOptions.apply(this, arguments),
				//		settings = types.get(options, 'settings', {});
				//};
				
				make.setOptions({
					settings: {
						sourceDir: "./src/",
						buildDir: "./build/",
						installDir: "./dist/",
						unix: {
							dataPath: "/var/lib/",
							libPath: "/usr/local/lib/",
						},
					},
				}, _options);
				

					
				make.REGISTER(doodad.BASE(doodad.Object.$extend(
				{
					$TYPE_NAME: 'Operation',
					
					execute: doodad.PUBLIC(doodad.MUST_OVERRIDE()), // function execute(command, item, /*optional*/options)
				})));
					
					
					
				makeModules.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Load',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						console.info('Loading required modules...');
						return Promise.all(tools.map(item.names, function(name) {
							if (types.isArray(name)) {
								return modules.load.apply(modules, name);
							} else {
								return modules.load(name);
							};
						}));
					}),
				}));

				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Create',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parseVariables(dest, {isPath: true});
						};
						console.info('Creating folder "' + dest + '"...');
						return files.mkdir(dest, {async: true});
					}),
				}));

				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Copy',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parseVariables(dest, { isPath: true });
						};
						console.info('Copying folder "' + source + '" to "' + dest + '"...');
						return files.mkdir(dest, {makeParents: true, async: true})
							.then(function() {
								return files.copy(source, dest, {recursive: true, override: true, async: true});
							});
					}),
				}));

				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Delete',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parseVariables(dest, { isPath: true });
						};
						console.info('Deleting folder "' + dest + '"...');
						return files.rmdir(dest, {force: true, async: true});
					}),
				}));

				
				
				file.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Copy',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parseVariables(dest, { isPath: true });
						};
						console.info('Copying file "' + source + '" to "' + dest + '"...');
						return files.mkdir(dest.set({file: null}), {makeParents: true, async: true})
							.then(function() {
								return files.copy(source, dest, {override: true, async: true});
							});
					}),
				}));
				
				file.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Javascript',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parseVariables(dest, { isPath: true });
						};
						const directives = types.get(options, 'directives'),
							variables = types.get(options, 'variables');
						console.info('Minifying file "' + source + '" to "' + dest + '"...');
						return files.mkdir(dest.set({file: null}), {makeParents: true, async: true})
							.then(function() {
								const jsStream = new minifiers.Javascript({autoFlush: false, runDirectives: types.get(item, 'runDirectives')});
								if (directives) {
									tools.forEach(directives, function(directive) {
										jsStream.runDirective(directive);
									});
								};
								if (variables) {
									tools.forEach(variables, function(value, name) {
										jsStream.define(name, value);
									});
								};
								return new Promise(function(resolve, reject) {
									try {
                                        const inputStream = nodeFs.createReadStream(source.toString({shell: 'api'}));
										const jsStreamDuplex = jsStream.getInterface(nodejsIOInterfaces.ITransform);
                                        const outputStream = nodeFs.createWriteStream(dest.toString({shell: 'api'}));
										outputStream.on('close', resolve);
										outputStream.on('error', reject);
										inputStream
											.pipe(jsStreamDuplex)
											.pipe(outputStream);
									} catch(ex) {
										reject(ex);
									};
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
							});
					}),
				}));

				
				
				spawn.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Node',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parseVariables(source, { isPath: true });
						};
						return new Promise(function(resolve, reject) {
							const cp = nodejs.fork(source, item.args, {stdio: ['pipe', 1, 2]});
							cp.on('close', function(status) {
								if (status) {
									reject(new types.Error("Process exited with code '~0~'.", [result.status]));
								} else {
									resolve();
								};
							});
						});
					}),
				}));

				
				
				
				generate.REGISTER(make.Operation.$extend({
					$TYPE_NAME: 'Configuration',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let destination = item.destination;
						if (types.isString(destination)) {
							destination = make.parseVariables(destination, { isPath: true });
						};
						return files.mkdir(destination.set({file: null}), {makeParents: true, async: true})
							.then(function() {
								console.info('Saving configuration to "' + destination + '"...');
								return require('npm-package-config').list(__Internal__.packageName, {beautify: true, async: true})
									.then(function(config) {
										config = types.extend({}, config, {Make: {settings: make.getOptions().settings}}); // preserve paths
										return new Promise(function(resolve, reject) {
											nodeFs.writeFile(destination.toString({shell: 'api'}), JSON.stringify(config), {encoding: 'utf-8'}, function(ex) {
												if (ex) {
													reject(ex);
												} else {
													resolve();
												};
											});
										});
									});
							});
					}),
				}));


				
				make.REGISTER(make.Operation.$extend({
					$TYPE_NAME: 'Task',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						console.info('Starting task "' + item.name + '"...');
						return make.run(item.name, options);
					}),
				}));
				
				

				browserify.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Resources',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parseVariables(dest, { isPath: true });
						};
						let resFile = item.resourcesFile;
						if (types.isString(resFile)) {
							resFile = make.parseVariables(resFile, { isPath: true });
						};
						resFile = dest.combine(resFile);
						const resources = [];
						console.info('Preparing resources for \'browserify\' from "' + source + '" to "' + dest + '"...');
						return files.mkdir(dest, {makeParents: true, async: true})
							.then(function() {
								return files.readdir(source, {async: true, depth: Infinity, relative: true});
							})
							.then(function(dir) {
								return Promise.all(tools.map(dir, function(stats) {
									if (stats.isFolder) {
										return files.mkdir(dest.combine(stats.path), {async: true});
									} else if (stats.isFile) {
										const resource = {
											source: stats.path,
											dest: stats.path.set({file: stats.path.file + '.res.js'}),
										};
										return files.readFile(source.combine(resource.source), {encoding: (item.encoding || 'utf-8'), async: true})
											.then(function(content) {
												return new Promise(function(resolve, reject) {
													nodeFs.writeFile(dest.combine(resource.dest).toString(), 
																	// TODO: See how I can write this
																	//'// This file is built from the file \'' + resource.source.file + '\' from the project package named \'' + 
																	//	__Internal__.packageName + '\' hosted by the \'npmjs.com\' web site, ' + 
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
											});
									};
								}));
							})
							.then(function() {
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
									let code = "switch(tmp[" + String(level + 1) + "]) {";
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
								
								const jsOp = new file.Javascript();
								return jsOp.execute(command, {
									source: files.Path.parse(module.filename).set({file: 'resources.templ.js'}),
									destination: resFile,
									runDirectives: true,
								}, {
									variables: {
										name: make.parseVariables(item.name),
										namespace: make.parseVariables(item.namespace),
										resources: resBody,
									},
								});
							});
					}),
				}));

				browserify.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Bundle',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parseVariables(source, { isPath: true });
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parseVariables(dest, { isPath: true });
						};
						if (nodeBrowserify) {
							console.info('Browserifying "' + source + '" to "' + dest + '"...');
							return new Promise(function(resolve, reject) {
								try {
									const b = nodeBrowserify();
									b.add(source.toString());
									const outputStream = nodeFs.createWriteStream(dest.toString());
									let bundleStream = b.bundle();
									if (item.minify) {
										const jsStream = new minifiers.Javascript();
										jsStream.listen();
										const jsStreamDuplex = jsStream.getInterface(nodejsIOInterfaces.ITransform);
										bundleStream = bundleStream
											.pipe(jsStreamDuplex)
											.pipe(outputStream)
									} else {
										bundleStream = bundleStream
											.pipe(outputStream)
									};
									bundleStream
										.on('finish', resolve)
										.on('error', reject);
								} catch(ex) {
									reject(ex);
								};
							});
						} else {
							console.warn('Can\'t browserify "' + source + '" to "' + dest + '"...');
							return Promise.resolve();
						};
					}),
				}));

				make.parseVariables = function parseVariables(val, /*optional*/options) {
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

					let path = val,
						isRelative = true;
					if (isPath) {
						if (!(path instanceof files.Path)) {
							path = solvePath(val);
						};
						isRelative = path.isRelative;
						path = path.toArray();
					} else {
						path = [String(path)];
					};
					
					const os = tools.getOS();

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
								if (__Internal__.packageName) {
									value = __Internal__.packageName;
								} else {
									throw new types.Error("Package name not specified.");
								};
							} else if (nameLc === '%packageversion%') {
								if (__Internal__.packageVersion) {
									value = __Internal__.packageVersion;
								} else {
									throw new types.Error("Package version not specified.");
								};
							} else if (nameLc === '%packagedir%') {
								if (__Internal__.packageDir) {
									value = solvePath(__Internal__.packageDir);
								} else {
									throw new types.Error("Package directory not specified.");
								};
							} else if (nameLc === '%sourcedir%') {
								if (__Internal__.sourceDir) {
									value = solvePath(__Internal__.sourceDir);
								} else {
									throw new types.Error("Source directory not specified.");
								};
							} else if (nameLc === '%builddir%') {
								if (__Internal__.buildDir) {
									value = solvePath(__Internal__.buildDir);
								} else {
									throw new types.Error("Build directory not specified.");
								};
							} else if (nameLc === '%installdir%') {
								if (__Internal__.installDir) {
									value = solvePath(__Internal__.installDir);
								} else {
									throw new types.Error("Installation directory not specified.");
								};
							} else if (nameLc === '%programdata%') {
								if (os.type === 'windows') {
									value = solvePath(process.env.programdata, os.type);
								} else {
									// There is no environment variable for this purpose under Unix-like systems
									// So I use "package.json"'s "config" section.
									value = solvePath(make.getOptions().settings.unix.dataPath || "/var/lib/", os.type);
								};
							} else if (nameLc === '%programfiles%') {
								if (os.type === 'windows') {
									value = solvePath(process.env.programfiles, os.type);
								} else {
									// There is no environment variable for this purpose under Unix-like systems
									// So I use "package.json"'s "config" section.
									value = solvePath(make.getOptions().settings.unix.libPath || "/usr/local/lib/", os.type);
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
								if (!types.hasKey(process.env, tmp)) {
									throw new types.Error("Invalid environment variable name: '~0~'.", [tmp]);
								};
								value = process.env[tmp];
								if (value.indexOf(os.dirChar) >= 0) {
									value = solvePath(value, os.type);
								};
							};
							
							if (value instanceof files.Path) {
								//if (isPath && !isRelative) {
								//	throw types.Error("Path in '~0~' can't be inserted because the target path is absolute.", [name]);
								//};
								if ((i > 0) && !value.isRelative) {
									throw types.Error("Path in '~0~' can't be inserted because it is not relative.", [name]);
								};
								result += value.toString({
									os: os.type,
									dirChar: os.dirChar,
									shell: 'api',
									noEscapes: true,
								});
							} else {
								result += String(value);
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
				};
				
				
				
				make.run = function run(command, /*optional*/options) {
					// TODO: Uninstall
					function combineWithPackageDir(path) {
						path = files.Path.parse(path, {noEscapes: true, dirChar: ['/', '\\'], isRelative: null}).set({
							noEscapes: false,
							dirChar: null,
						});
						if (path.isRelative) {
							path = __Internal__.packageDir.combine(path);
						};
						return path;
					};

					__Internal__.packageDir = root.Doodad.Tools.Files.Path.parse(types.get(options, 'path', process.cwd()));
					
					const pack = require(combineWithPackageDir('./package.json').toString());
					
					__Internal__.packageName = pack.name;
					__Internal__.packageVersion = pack.version;
					__Internal__.sourceDir = combineWithPackageDir(types.get(options, 'sourceDir', make.getOptions().settings.sourceDir) || './src');
					__Internal__.buildDir = combineWithPackageDir(types.get(options, 'buildDir', make.getOptions().settings.buildDir) || './build');
					__Internal__.installDir = combineWithPackageDir(types.get(options, 'installDir', make.getOptions().settings.installDir) || './dist');
					
					let data = require(combineWithPackageDir('./make.json').toString());
					data = types.get(data.makeData.tasks, command);
					
					const objs = {};
					
					var proceed = function proceed(index) {
						if (index < data.operations.length) {
							const item = data.operations[index];
							
							let obj = item['class'];
								
							if (types.isString(obj)) {
								if (types.hasKey(objs, obj)) {
									obj = objs[obj];
								} else {
									const cls = namespaces.getNamespace(obj);
									if (!types._implements(cls, make.Operation)) {
										throw new types.Error("Invalid class '~0~'.", [obj]);
									};
									objs[obj] = obj = new cls();
								};
								
								item['class'] = obj;
							};
							
							let result = obj.execute(command, item, options);
							
							return result
								.then(function() {
									return proceed(++index);
								});
						} else {
							return Promise.resolve();
						};
					};
					
					return proceed(0);
				};
			},
		};
		
		return DD_MODULES;
	};
	
	if (typeof process !== 'object') {
		// <PRB> export/import are not yet supported in browsers
		global.DD_MODULES = exports.add(global.DD_MODULES);
	};
}).call((typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this));