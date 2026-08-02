const globals = require('globals');
const configBase = require('@doodad-js/eslint-config-base');
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
	{
		ignores: [
			"**/*.mjs",
			'**/*.inc.js',
			'**/*.templ.js',
			'**/*.config.js',
		],
	},

	{
		files: ["src/**/*.js"],

		rules: {
			...configBase.configs.recommended.rules,
			
			// That's a CLI.
			"no-console": "off",
		},

		languageOptions: {
            ecmaVersion: 2021,
			globals: {...globals.browser, ...globals.node},
            sourceType: "commonjs",
        },
	},
]);