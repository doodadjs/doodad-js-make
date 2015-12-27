//! REPLACE_BY("// Copyright 2015 Claude Petit, licensed under Apache License version 2.0\n")
// dOOdad - Object-oriented programming framework with some extras
// File: _Make.js - Make module
// Project home: https://sourceforge.net/projects/doodad-js/
// Trunk: svn checkout svn://svn.code.sf.net/p/doodad-js/code/trunk doodad-js-code
// Author: Claude Petit, Quebec city
// Contact: doodadjs [at] gmail.com
// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
// License: Apache V2
//
//	Copyright 2015 Claude Petit
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
	if (global.process) {
		module.exports = exports;
	};
	
	exports.add = function add(DD_MODULES, /*optional*/__options__) {
		DD_MODULES = (DD_MODULES || {});
		DD_MODULES['Make'] = {
			type: null,
			version: '0d',
			namespaces: ['Folder', 'File', 'File.Spawn', 'Generate'],
			dependencies: ['Doodad.Types', 'Doodad.Tools', 'Doodad', 'Doodad.NodeJs', 'Doodad.Namespaces', 'Doodad.IO.Minifiers'],
			exports: exports,
			
			create: function create(root, /*optional*/_options) {
				"use strict";

				const doodad = root.Doodad,
					tools = doodad.Tools,
					files = tools.Files,
					config = tools.Config,
					types = doodad.Types,
					nodejs = doodad.NodeJs,
					namespaces = doodad.Namespaces,
					io = doodad.IO,
					minifiers = io.Minifiers,
					make = root.Make,
					folder = make.Folder,
					file = make.File,
					spawn = file.Spawn,
					generate = make.Generate,
					
					nodeFs = require('fs'),
					nodeChildProcess = require('child_process');
					
					
				const __Internal__ = {
					packageName: null,
					packageVersion: null,
					packageDir: null,
					makeDir: null,
					sourceDir: null,
					buildDir: null,
					installDir: null,
					makeData: null,
				};
					
					
					
				_options = types.depthExtend(2, {
					settings: {
						sourceDir: "./src/",
						buildDir: "./build/",
						installDir: "./dist/",
						unix: {
							dataPath: "/var/lib/",
							libPath: "/usr/local/lib/",
						},
					},
				}, __options__, _options);
					

					
				make.REGISTER(doodad.BASE(doodad.Object.$extend(
				{
					$TYPE_NAME: 'Operation',
					
					execute: doodad.PUBLIC(doodad.MUST_OVERRIDE()), // function execute(command, item, /*optional*/options)
				})));
					
					
					
				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Create',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parsePathEnv(dest, _options);
						};
						console.info('Creating folder "' + dest + '"...');
						files.mkdir(dest);
					}),
				}));

				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Copy',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parsePathEnv(source, _options);
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parsePathEnv(dest, _options);
						};
						files.mkdir(dest, {makeParents: true});
						console.info('Copying folder "' + source + '" to "' + dest + '"...');
						files.copy(source, dest, {recursive: true, override: true});
					}),
				}));

				folder.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Delete',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parsePathEnv(dest, _options);
						};
						console.info('Deleting folder "' + dest + '"...');
						files.rmdir(dest, {force: true});
					}),
				}));

				
				
				file.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Copy',

					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parsePathEnv(source, _options);
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parsePathEnv(dest, _options);
						};
						files.mkdir(dest.set({file: null}), {makeParents: true});
						console.info('Copying file "' + source + '" to "' + dest + '"...');
						files.copy(source, dest, {override: true});
					}),
				}));
				
				file.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Javascript',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parsePathEnv(source, _options);
						};
						let dest = item.destination;
						if (types.isString(dest)) {
							dest = make.parsePathEnv(dest, types.extend({mkdir: true}, _options));
						};
						files.mkdir(dest.set({file: null}), {makeParents: true});
						console.info('Minifying file "' + source + '" to "' + dest + '"...');
						const content = nodeFs.readFileSync(source.toString({shell: 'api'}), {encoding: 'utf8'}),
							destFd = nodeFs.openSync(dest.toString({shell: 'api'}), 'w'),
							jsStream = new minifiers.Javascript();
						jsStream.onReady.attach(null, new doodad.Callback(this, function(ev) {
							const data = ev.data;
							if (data.raw === io.EOF) {
								nodeFs.close(destFd);
							} else {
								nodeFs.writeSync(destFd, data.text);
							};
							ev.preventDefault();
						}));
						jsStream.listen();
						jsStream.write(content);
						jsStream.write(io.EOF);
						jsStream.flush();
						jsStream.stopListening();
						jsStream.destroy();
					}),
				}));

				
				
				spawn.REGISTER(make.Operation.$extend(
				{
					$TYPE_NAME: 'Node',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let source = item.source;
						if (types.isString(source)) {
							source = make.parsePathEnv(source, _options);
						};
						const result = nodejs.forkSync(source, item.args, {stdio: ['pipe', 1, 2]});
						if (result.status) {
							throw new types.Error("Process exited with code '~0~'.", [result.status]);
						};
					}),
				}));

				
				
				
				generate.REGISTER(make.Operation.$extend({
					$TYPE_NAME: 'Configuration',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						let destination = item.destination;
						if (types.isString(destination)) {
							destination = make.parsePathEnv(destination, types.extend({mkdir: true}, _options));
						};
						files.mkdir(destination.set({file: null}), {makeParents: true});
						console.info('Saving configuration to "' + destination + '"...');
						let config = require('npm-package-config').list(__Internal__.packageName, {beautify: true});
						config = types.extend({}, config, {Make: {settings: _options.settings}}); // preserve paths
						nodeFs.writeFileSync(destination.toString({shell: 'api'}), JSON.stringify(config), {encoding: 'utf8'});
					}),
				}));


				
				make.REGISTER(make.Operation.$extend({
					$TYPE_NAME: 'Task',
					
					execute: doodad.OVERRIDE(function execute(command, item, /*optional*/options) {
						console.info('Starting task "' + item.name + '"...');
						make.run(item.name, options);
					}),
				}));
				
				
				make.parsePathEnv = function parsePathEnv(path, /*optional*/options) {
					if (types.isString(path)) {
						path = tools.Path.parse(path, {
							os: 'linux',
							dirChar: '/',
							shell: 'api',
							noEscapes: true,
							isRelative: true,
						});
					};
					let packageDir = types.get(options, 'packageDir') || process.cwd();
					if (types.isString(packageDir)) {
						packageDir = tools.Path.parse(packageDir);
					};
					const osType = tools.getOS().type;
					let dirs = path.path,
						i = 0;
					while (i < dirs.length) {
						let dir = dirs[i],
							set = false;
						if ((dir[0] === '%') && (dir[dir.length - 1] === '%')) {
							const envName = dir.slice(1, dir.length - 1);
							dir = dir.toLowerCase();
							set = true;
							if (dir === '%packagename%') {
								dir = __Internal__.packageName;
								if (!dir) {
									throw new types.Error("Package name not specified.");
								};
							} else if (dir === '%packageversion%') {
								dir = __Internal__.packageVersion;
								if (!dir) {
									throw new types.Error("Package version not specified.");
								};
							} else if (dir === '%packagedir%') {
								dir = __Internal__.packageDir;
								if (!dir) {
									throw new types.Error("Package directory not specified.");
								};
								dir = make.parsePathEnv(dir, options);
							} else if (dir === '%sourcedir%') {
								dir = __Internal__.sourceDir;
								if (!dir) {
									throw new types.Error("Source directory not specified.");
								};
								dir = make.parsePathEnv(dir, options);
							} else if (dir === '%builddir%') {
								dir = __Internal__.buildDir;
								if (!dir) {
									throw new types.Error("Build directory not specified.");
								};
								dir = make.parsePathEnv(dir, options);
							} else if (dir === '%installdir%') {
								dir = __Internal__.installDir;
								if (!dir) {
									throw new types.Error("Installation directory not specified.");
								};
								dir = make.parsePathEnv(dir, options);
							} else if (dir === '%programdata%') {
								if (osType === 'windows') {
									dir = process.env[envName];
								} else {
									// There is no environment variable for this purpose under Unix-like systems
									// So I use "package.json"'s "config" section.
									dir = _options.settings.unix.dataPath || "/var/lib/";
								};
							} else if (dir === '%programfiles%') {
								if (osType === 'windows') {
									dir = process.env[envName];
								} else {
									// There is no environment variable for this purpose under Unix-like systems
									// So I use "package.json"'s "config" section.
									dir = _options.settings.unix.libPath || "/usr/local/lib/";
								};
							} else if ((dir === '%appdata%') || (dir === '%localappdata%')) {
								if (osType === 'windows') {
									dir = process.env[envName];
								} else {
									dir = process.env.HOME;
								};
							//...
							} else {
								dir = process.env[envName];
							};
						};
						if (set) {
							if (types.isString(dir)) {
								dir = tools.Path.parse(dir, {
									isRelative: null,  // auto-detect
								});
							};
							dir = dir.pushFile(); // some environment variables doesn't have a leading slash
							if (dir.isRelative) {
								dirs.splice.apply(dirs, types.append([i, 1], dir.path));
							} else {
								dirs.splice(i, 1);
								path = dir.combine(path, {noEscapes: true});
								dirs = path.path;
								i = 0;
							};
						} else {
							i++;
						};
					};
					if (path.isRelative) {
						path = packageDir.combine(path);
					};
					return path.set({
						os: null, // force current os
						dirChar: null, // force current os dirChar
						noEscapes: false, // re-enable escapes
					});
				};
				
				
				make.run = function run(command, /*optional*/options) {
					// TODO: Uninstall
					
					function combineWithPackageDir(path) {
						path = tools.Path.parse(path, {noEscapes: true, dirChar: ['/', '\\'], isRelative: null}).set({
							noEscapes: false,
							dirChar: null,
						});
						if (path.isRelative) {
							path = __Internal__.packageDir.combine(path);
						};
						return path;
					};

					__Internal__.packageDir = root.Doodad.Tools.Path.parse(types.get(options, 'path', process.cwd())).pushFile();
					
					const pack = require(combineWithPackageDir('./package.json').toString());
					
					__Internal__.packageName = pack.name;
					__Internal__.packageVersion = pack.version;
					__Internal__.makeDir = combineWithPackageDir('./scripts/');
					__Internal__.sourceDir = combineWithPackageDir(types.get(options, 'sourceDir', _options.settings.sourceDir) || './src');
					__Internal__.buildDir = combineWithPackageDir(types.get(options, 'buildDir', _options.settings.buildDir) || './build');
					__Internal__.installDir = combineWithPackageDir(types.get(options, 'installDir', _options.settings.installDir) || './dist');
					
					let data = require(combineWithPackageDir('./make.json').toString());
					data = types.get(data.makeData.tasks, command);
					
					const objs = {};
					tools.forEach(data.operations, function(item, key) {
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
						
						obj.execute(command, item, options);
					});
				};
			},
		};
		
		return DD_MODULES;
	};
	
	if (!global.process) {
		// <PRB> export/import are not yet supported in browsers
		global.DD_MODULES = exports.add(global.DD_MODULES);
	};
})();