//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n", true)
// doodad-js - Object-oriented programming framework
// File: tests.js - Test module startup file
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
		DD_MODULES = DD_MODULES || {};
		DD_MODULES[/*! INJECT(TO_SOURCE(MANIFEST("name") + "/tests")) */] = {
			version: /*! INJECT(TO_SOURCE(VERSION(MANIFEST("name")))) */,
			type: 'TestPackage',
			dependencies: /*! INJECT(TO_SOURCE(VAR("dependencies"), 2)) */,
			
			create: function create(root, /*optional*/_options, _shared) {
				"use strict";
				
				//! IF_DEF("modules")

					var doodad = root.Doodad,
						types = doodad.Types,
						modules = doodad.Modules,
						fromSource = root.getOptions().fromSource;
				
					var files = {};
					if (fromSource) { 
						//! MAP(VAR("modulesSrc"), "mod")
							//! IF(!VAR("mod.manual"))
								files[/*! INJECT(TO_SOURCE(VAR("mod.dest"))) */] = {optional: /*! INJECT(TO_SOURCE(VAR("mod.optional"))) */};
							//! END_IF()
						//! END_MAP()
					} else { 
						//! MAP(VAR("modules"), "mod")
							//! IF(!VAR("mod.manual"))
								files[/*! INJECT(TO_SOURCE(VAR("mod.dest"))) */] = {optional: /*! INJECT(TO_SOURCE(VAR("mod.optional"))) */};
							//! END_IF()
						//! END_MAP()
					};

					var _modules = {};
					_modules[/*! INJECT(TO_SOURCE(MANIFEST("name"))) */] = files;

					return modules.load(_modules, types.extend({}, _options, {secret: _shared.SECRET}))
						.then(function() {
							// Returns nothing
						});

				//! ELSE()
					var DD_MODULES = {};
				
					//! INCLUDE(VAR("bundle"), null, true)
						
					return root.Doodad.Namespaces.load(DD_MODULES, null, root.Doodad.Types.extend({}, _options, {secret: _shared.SECRET}))
						.then(function() {
							// Returns nothing
						});
					
				//! END_IF()
			},
		};
		return DD_MODULES;
	},
};
//! END_MODULE()