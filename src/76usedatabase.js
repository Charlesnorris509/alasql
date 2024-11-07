/*
//
// UPDATE for Alasql.js
// Date: 03.11.2014
// Modified: 16.11.2014
// (c) 2014, Andrey Gershun
//
*/

/* global yy alasql */

// CREATE DATABASE databaseid
yy.CreateDatabase = (params) => Object.assign(this, params); // Updated to arrow function

yy.CreateDatabase.prototype.toString = function () {
	let s = 'CREATE '; // Added space after 'CREATE' for clarity
	if (this.engineid) s += `${this.engineid} `;
	s += 'DATABASE ';
	if (this.ifnotexists) s += 'IF NOT EXISTS ';
	s += `${this.databaseid} `;

	if (this.args?.length) { // Optional chaining for args presence check
		s += `(${this.args.map(arg => arg.toString()).join(', ')}) `;
	}
	if (this.as) s += `AS ${this.as}`;
	return s;
};

yy.CreateDatabase.prototype.execute = function (databaseid, params, cb) {
	let args;
	if (this.args?.length) { // Optional chaining and let for block scoping
		args = this.args.map(arg => new Function('params,alasql', `var y;return ${arg.toJS()}`)(params, alasql)); // Template literals for readability
	}
	if (this.engineid) {
		return alasql.engines[this.engineid].createDatabase(this.databaseid, this.args, this.ifnotexists, this.as, cb);
	} else {
		const dbid = this.databaseid;
		if (alasql.databases[dbid]) {
			throw new Error(`Database '${dbid}' already exists`);
		}
		const dbInstance = new alasql.Database(dbid); // Renamed variable for clarity
		const res = 1;
		return cb ? cb(res) : res;
	}
};

// CREATE DATABASE databaseid
yy.AttachDatabase = (params) => Object.assign(this, params); // Updated to arrow function

yy.AttachDatabase.prototype.toString = function (args) {
	let s = 'ATTACH';
	if (this.engineid) s += ` ${this.engineid}`;
	s += ` DATABASE ${this.databaseid}`;
	if (args?.length) { // Optional chaining and length check
		s += `(${args.map(arg => arg.toString()).join(', ')})`;
	}
	if (this.as) s += ` AS ${this.as}`;
	return s;
};

yy.AttachDatabase.prototype.execute = function (databaseid, params, cb) {
	if (!alasql.engines[this.engineid]) {
		throw new Error(`Engine "${this.engineid}" is not defined.`);
	}
	return alasql.engines[this.engineid].attachDatabase(this.databaseid, this.as, this.args, params, cb);
};

// CREATE DATABASE databaseid
yy.DetachDatabase = (params) => Object.assign(this, params); // Updated to arrow function

yy.DetachDatabase.prototype.toString = function () {
	return `DETACH DATABASE ${this.databaseid}`; // Template literal for consistency
};

yy.DetachDatabase.prototype.execute = function (databaseid, params, cb) {
	if (!alasql.databases[this.databaseid]?.engineid) {
		throw new Error(`Cannot detach database "${this.databaseid}", because it was not attached.`); // Updated error message
	}

	const dbid = this.databaseid;
	if (dbid === alasql.DEFAULTDATABASEID) {
		throw new Error('Drop of default database is prohibited');
	}

	let res;
	const dbInstance = alasql.databases[dbid]; // Renamed for clarity
	if (!dbInstance) {
		res = this.ifexists ? 0 : (() => { throw new Error(`Database '${dbid}' does not exist`); })();
	} else {
		const isFS = dbInstance.engineid === 'FILESTORAGE';
		const filename = dbInstance.filename || '';

		delete alasql.databases[dbid];

		if (isFS) {
			alasql.databases[dbid] = { isDetached: true, filename }; // Keep file name for potential DROP
		}

		if (dbid === alasql.useid) alasql.use(); // Reset to default if detached
		res = 1;
	}

	if (cb) cb(res);
	return res;
};

// USE DATABASE databaseid
yy.UseDatabase = (params) => Object.assign(this, params); // Updated to arrow function

yy.UseDatabase.prototype.toString = function () {
	return `USE DATABASE ${this.databaseid}`; // Template literal for consistency
};

yy.UseDatabase.prototype.execute = function (databaseid, params, cb) {
	const dbid = this.databaseid;
	if (!alasql.databases[dbid]) {
		throw new Error(`Database '${dbid}' does not exist`);
	}
	alasql.use(dbid);
	const res = 1;
	if (cb) cb(res);
	return res;
};

// DROP DATABASE databaseid
yy.DropDatabase = (params) => Object.assign(this, params); // Updated to arrow function

yy.DropDatabase.prototype.toString = function () {
	return `DROP${this.ifexists ? ' IF EXISTS' : ''} DATABASE ${this.databaseid}`; // Template literal with conditional
};

yy.DropDatabase.prototype.execute = function (databaseid, params, cb) {
	if (this.engineid) {
		return alasql.engines[this.engineid].dropDatabase(this.databaseid, this.ifexists, cb);
	}

	const dbid = this.databaseid;
	if (dbid === alasql.DEFAULTDATABASEID) {
		throw new Error('Drop of default database is prohibited');
	}

	let res;
	const dbInstance = alasql.databases[dbid]; // Renamed for clarity

	if (!dbInstance) {
		res = this.ifexists ? 0 : (() => { throw new Error(`Database '${dbid}' does not exist`); })();
	} else {
		if (dbInstance.engineid) {
			throw new Error(`Cannot drop database '${dbid}', because it is attached. Detach it first.`);
		}
		delete alasql.databases[dbid];
		if (dbid === alasql.useid) alasql.use(); // Reset current database if it was in use
		res = 1;
	}

	if (cb) cb(res);
	return res;
};
