//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2015-2017 Claude Petit, licensed under Apache License version 2.0\n", true)
// doodad-js - Object-oriented programming framework
// File: resources.js - Resources index file for 'browserify'.
// Project home: https://github.com/doodadjs/
// Author: Claude Petit, Quebec city
// Contact: doodadjs [at] gmail.com
// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
// License: Apache V2
//
//	Copyright 2015-2017 Claude Petit
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

exports.add = function add(DD_MODULES) {
	DD_MODULES = DD_MODULES || {};
	DD_MODULES[/*! INJECT(TO_SOURCE(VAR("name"))) */] = {
		version: /*! INJECT(TO_SOURCE(VERSION(MANIFEST("name")))) */,
		type: 'Package',
		dependencies: ['Doodad.Tools.Files', 'Doodad.Namespaces'],
			
		create: function create(root, /*optional*/_options, _shared) {
			const doodad = root.Doodad,
				nodejs = doodad.NodeJs,
				types = doodad.Types,
				tools = doodad.Tools,
				files = tools.Files,
				modules = tools.Modules,
				namespaces = doodad.Namespaces;
					
			const Promise = types.getPromise(),
				mod = namespaces.get(/*! TO_SOURCE(VAR("namespace")) */);
				
			mod.setResourcesLoader({
				locate: function locate(name, /*optional*/options) {
					return Promise.try(function tryLocate() {
						return files.parsePath(name);
					});
				},
				load: function load(path, /*optional*/options) {
					return Promise.try(function() {
						const tmp = path.toArray();

						const callback = types.get(options, 'callback');

						let result = null;
								
//! INJECT(VAR("resources"))
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
									default:
										throw new types.Error("Unknown resource file '~0~'.", [path.toString()]);
								};
							default:
								throw new types.Error("Unknown resource file '~0~'.", [path.toString()]);
						};
//! END_REMOVE()
						if (callback) {
							callback(null, result);
						};
							
						return result;
					})
					.catch(function(err) {
						if (callback) {
							callback(err, null);
						};

						throw err;
					});
				},
			});
		},
	};
	return DD_MODULES;
};

//! END_MODULE()