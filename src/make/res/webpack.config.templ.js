module.exports = {
	entry: /*! INJECT(TO_SOURCE(VAR("entry"))) */,
	module: {
		loaders: [
			{ test: /\.json$/, loader: "json" }
		],
	},
};