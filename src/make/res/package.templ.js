//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2015-2018 Claude Petit, licensed under Apache License version 2.0\n", true)
// doodad-js - Object-oriented programming framework
// File: package.js - Module startup file (client-side, CommonJs)
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

		create: function create(root, /*optional*/_options, _shared) {
			let DD_MODULES = {},
				DD_EXPORTS = null;

			// NOTE: The bundle will fill "DD_MODULES".
			//! INCLUDE(VAR("bundle"), 'utf-8', true)

			return (function(mods) {
				const options = [/*! (VAR("config") ? INCLUDE(VAR("config"), 'utf-8') : INJECT("null")) */, _options, {startup: {secret: _shared.SECRET}}];

				DD_MODULES = null; // free memory
				DD_EXPORTS = null; // free memory

				return root.Doodad.Namespaces.load(mods, options)
					.then(function() {
						// Returns nothing
					});
			})(DD_MODULES);
		},
	};
	return modules;
};
//! END_MODULE();
