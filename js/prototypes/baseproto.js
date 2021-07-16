var baseproto = {
	_protoName: 'baseproto',

	isPrototypeOf: function(obj) {
		return obj._protoName && this._protoName === obj._protoName;
	},

	getPrototypeOf: function() {
		return this._protoName;
	}
}


module.exports = baseproto;