//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2015-2018 Claude Petit, licensed under Apache License version 2.0\n", true)
// doodad-js - Object-oriented programming framework
// File: index.js - Module startup file (server-side, CommonJs)
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

exports.add = function add(modules) {
	modules = modules || {};
	modules[/*! INJECT(TO_SOURCE(MANIFEST("name"))) */] = {
		version: /*! INJECT(TO_SOURCE(VERSION(MANIFEST("name")))) */,
		type: /*! INJECT(TO_SOURCE(MAKE_MANIFEST("type"))) */,
		dependencies: /*! INJECT(TO_SOURCE(VAR("dependencies"), 2)) */,
					
		create: function create(root, /*optional*/options, _shared) {
			const files = [{
				module: /*! INJECT(TO_SOURCE(MANIFEST("name"))) */,
				path: 'config.json',
				optional: true,
				isConfig: true,
			}];

			const fromSource = root.getOptions().fromSource;
			if (fromSource) { 
				//! FOR_EACH(VAR("modulesSrc"), "mod")
					//! IF(!VAR("mod.manual") && !VAR("mod.exclude"))
						files.push({
							module: /*! INJECT(TO_SOURCE(MANIFEST("name"))) */,
							path: /*! INJECT(TO_SOURCE(VAR("mod.dest"))) */,
							optional: /*! INJECT(TO_SOURCE(VAR("mod.optional"))) */,
						});
					//! END_IF()
				//! END_FOR()
			} else { 
				//! FOR_EACH(VAR("modules"), "mod")
					//! IF(!VAR("mod.manual") && !VAR("mod.exclude"))
						files.push({
							module: /*! INJECT(TO_SOURCE(MANIFEST("name"))) */,
							path: /*! INJECT(TO_SOURCE(VAR("mod.dest"))) */,
							optional: /*! INJECT(TO_SOURCE(VAR("mod.optional"))) */,
						});
					//! END_IF()
				//! END_FOR()
			};

			return root.Doodad.Modules.load(files, [options, {secret: _shared.SECRET}])
				.then(function() {
					// Returns nothing
				});
		},
	};
	return modules;
};
//! END_MODULE();
