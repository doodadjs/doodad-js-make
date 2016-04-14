//! REPLACE_BY("// Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n", true)
// dOOdad - Object-oriented programming framework
// File: resources.js - Resources index file for 'browserify'.
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

"use strict";

module.exports = {
	add: function add(DD_MODULES) {
		DD_MODULES = (DD_MODULES || {});
		DD_MODULES[/*! TO_SOURCE(VAR("name")) */] = {
			type: 'Package',
			version: '0a',
			dependencies: ['Doodad.Tools.Files', 'Doodad.Namespaces'],
			exports: module.exports,
			
			create: function create(root, /*optional*/_options) {
				var doodad = root.Doodad,
					types = doodad.Types,
					tools = doodad.Tools,
					files = tools.Files,
					namespaces = doodad.Namespaces;
					
				var Promise = types.getPromise(),
					mod = namespaces.getNamespace(/*! TO_SOURCE(VAR("namespace")) */);
				
				mod.setOptions({
					resourcesPath: '/',
					hooks: {
						resourcesLoader: {
							locate: function locate(name, /*optional*/options) {
								try {
									return Promise.resolve(
										files.getOptions().hooks.pathParser(mod.getOptions().resourcesPath)
											.combine(files.getOptions().hooks.pathParser(name))
									);
								} catch(ex) {
									return Promise.reject(ex);
								};
							},
							load: function load(path, /*optional*/options) {
								var tmp = path.toArray();
								try {
									var callback = types.get(options, 'callback'),
										result;
//! VAR("resources")
//! BEGIN_REMOVE()
				Exemple:
									switch(tmp[1]) {
										case "locales":
											switch(tmp[2]) {
												case "en_US":
													result = require("./locales/en_US.res.js");
													break;
												case "fr_FR":
													result = require("./locales/fr_FR.res.js");
													break;
												case "fr_CA":
													result = require("./locales/fr_CA.res.js");
													break;
												...
												default:
													throw new types.Error("Unknown resource file '~0~'.", [path.toString()]);
											};
										...
										default:
											throw new types.Error("Unknown resource file '~0~'.", [path.toString()]);
									};
//! END_REMOVE()
									if (callback) {
										callback(null, result);
									};
									
									return Promise.resolve(result);
									
								} catch(ex) {
									if (callback) {
										callback(ex, null);
									};

									return Promise.reject(ex);
								};
							},
						},
					},
				});
			},
		};
		return DD_MODULES;
	},
};