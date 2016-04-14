//! REPLACE_BY("// Copyright 2016 Claude Petit, licensed under Apache License version 2.0\n", true)
// dOOdad - Object-oriented programming framework
// File: browserify.js - Module startup file for 'browserify'.
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

//! IF_UNDEF("debug")
	//! DEFINE("debug", false)
//! END_IF()

"use strict";

module.exports = {
	add: function add(DD_MODULES) {
		DD_MODULES = (DD_MODULES || {});
		DD_MODULES[/*! INJECT(TO_SOURCE(MANIFEST("name"))) */] = {
			type: /*! INJECT(TO_SOURCE(MAKE_MANIFEST("type"))) */,
			version: /*! INJECT(TO_SOURCE(VERSION(MANIFEST("name")))) */,
			dependencies: /*! INJECT(TO_SOURCE(VAR("dependencies"), 2)) */,
			
			create: function create(root, /*optional*/_options) {
				"use strict";
				
				var doodad = root.Doodad,
					namespaces = doodad.Namespaces,
					types = doodad.Types,
					tools = doodad.Tools;
				
				var config = null;
				try {
					config = require('./config.json');
				} catch(ex) {
				};
				
				var DD_MODULES = {};
				
				//! FOR_EACH(VAR("resources"), "res")
					require(/*! INJECT(TO_SOURCE(VAR("res"))) */).add(DD_MODULES);
				//! END_FOR()
				
				//! FOR_EACH(VAR("modules"), "mod")
					//! IF(!VAR("mod.manual"))
						require(/*! INJECT(TO_SOURCE(VAR("mod.dest"))) */).add(DD_MODULES);
					//! END_IF()
				//! END_FOR()
				
				return namespaces.load(DD_MODULES, null, config, false)
					.then(function() {
						// Returns nothing
					});
			},
		};
		return DD_MODULES;
	},
};