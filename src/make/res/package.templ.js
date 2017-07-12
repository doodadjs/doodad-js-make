//! BEGIN_MODULE()

//! REPLACE_BY("// Copyright 2015-2017 Claude Petit, licensed under Apache License version 2.0\n", true)
// doodad-js - Object-oriented programming framework
// File: package.js - Module startup file (client-side)
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

module.exports = {
	add: function add(DD_MODULES) {
		DD_MODULES = DD_MODULES || {};
		DD_MODULES[/*! INJECT(TO_SOURCE(MANIFEST("name"))) */] = {
			version: /*! INJECT(TO_SOURCE(VERSION(MANIFEST("name")))) */,
			type: /*! INJECT(TO_SOURCE(MAKE_MANIFEST("type"))) */,
			dependencies: /*! INJECT(TO_SOURCE(VAR("dependencies"), 2)) */,

			create: function create(root, /*optional*/_options, _shared) {
				// DON'T PUT "use strict"; HERE !

				const DD_MODULE = undefined;
				const DD_MODULES = {};

				//! INCLUDE(VAR("bundle"), 'utf-8', true)

				return (function() {
					const options = [/*! INCLUDE(VAR("config"), 'utf-8') */, _options, {secret: _shared.SECRET}];

					return root.Doodad.Namespaces.load(DD_MODULES, options)
						.then(function() {
							// Returns nothing
						});
				})();
			},
		};
		return DD_MODULES;
	},
};
//! END_MODULE();