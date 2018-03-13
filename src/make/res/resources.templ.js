//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2015-2018 Claude Petit, licensed under Apache License version 2.0\n", true)
// doodad-js - Object-oriented programming framework
// File: resources.js - Resources index file for 'browserify'.
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

"use strict";

exports.add = function add(DD_MODULES) {
	DD_MODULES = DD_MODULES || {};
	DD_MODULES[/*! INJECT(TO_SOURCE(VAR("name"))) */] = {
		version: /*! INJECT(TO_SOURCE(VERSION(MANIFEST("name")))) */,
		type: 'Package',
		dependencies: ['Doodad.Types', 'Doodad.Tools', 'Doodad.Tools.Files', 'Doodad.Namespaces', /*! INJECT(TO_SOURCE(VAR("namespace"))) */],
			
		create: function create(root, /*optional*/_options, _shared) {
			const doodad = root.Doodad,
				types = doodad.Types,
				tools = doodad.Tools,
				files = tools.Files,
				namespaces = doodad.Namespaces;
					
			const mod = namespaces.get(/*! INJECT(TO_SOURCE(VAR("namespace"))) */);
			
			return function init(options) {
				const rp = files.parsePath('/', {os: 'linux'});

				mod.setResourcesLoader({
					locate: function locate(name, /*optional*/options) {
						const Promise = types.getPromise();
						return Promise.try(function tryLocate() {
							return rp.combine(name);
						});
					},
					load: function load(path, /*optional*/options) {
						const Promise = types.getPromise();
						return Promise.try(function() {
							const tmp = path.toArray({trim: true});

							let result = null;
									
							//! INJECT(VAR("resources"))

					//! BEGIN_REMOVE()
					Exemple:
							switch(tmp[0]) {
								case "locales":
									switch(tmp[1]) {
										case "en_US.json":
											result = require("./locales/en_US.json.res.js");
											break;
										case "fr_FR.json":
											result = require("./locales/fr_FR.json.res.js");
											break;
										case "fr_CA.json":
											result = require("./locales/fr_CA.json.res.js");
											break;
										default:
											throw new types.Error("Unknown resource file '~0~'.", [path.toString()]);
									};
								default:
									throw new types.Error("Unknown resource file '~0~'.", [path.toString()]);
							};
					//! END_REMOVE()
							
							if (path.extension === 'json') {
								result = JSON.parse(result);
							};

							return result;
						});
					},
				});
			};
		},
	};
	return DD_MODULES;
};

//! END_MODULE()