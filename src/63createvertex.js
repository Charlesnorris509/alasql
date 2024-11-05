/*
//
// CREATE VERTEX for AlaSQL
// Date: 04/11/2024
// (c) 2015, Andrey Gershu
//
*/
yy.CreateVertex = (params) => Object.assign(this, params); // Updated to arrow function
yy.CreateVertex.prototype.toString = function () {
	let s = 'CREATE VERTEX ';
	if (this.class) {
		s += `${this.class} `;
	}
	if (this.sharp) {
		s += `#${this.sharp} `;
	}
	if (this.sets) {
		s += this.sets.toString();
	} else if (this.content) {
		s += this.content.toString();
	} else if (this.select) {
		s += this.select.toString();
	}
	return s;
};

yy.CreateVertex.prototype.toJS = (context) => {
	// Construct query string with query function index
	return `this.queriesfn[${this.queriesidx - 1}](this.params,null,${context})`; // Updated to template literal
};

// CREATE TABLE

yy.CreateVertex.prototype.compile = function (databaseid) {
	const dbid = databaseid; // Changed to const for immutability
	const sharp = this.sharp; // const for fixed ID reference

	// CREATE VERTEX "Name"
	let namefn;
	if (this.name !== undefined) {
		const s = `x.name=${this.name.toJS()}`;
		namefn = new Function('x', s);
	}

	let setfn;
	if (this.sets && this.sets.length > 0) {
		const s = this.sets
			.map((st) => `x[${JSON.stringify(st.column.columnid)}]=${st.expression.toJS('x', '')}`)
			.join(';');
		setfn = new Function('x, params, alasql', s);
	}

	const statement = (params, cb) => {
		let res;
		const db = alasql.databases[dbid];
		const id = sharp ?? db.counter++; // Optional chaining for ID fallback
		const vertex = { $id: id, $node: 'VERTEX' };
		db.objects[vertex.$id] = vertex;
		res = vertex;

		// Execute name and set functions if defined
		namefn?.(vertex); // Optional chaining for cleaner invocation
		setfn?.(vertex, params, alasql);

		return cb ? cb(res) : res;
	};
	return statement;
};

// CREATE EDGE

yy.CreateEdge = (params) => Object.assign(this, params); // Updated to arrow function
yy.CreateEdge.prototype.toString = function () {
	let s = 'CREATE EDGE ';
	if (this.class) {
		s += `${this.class} `;
	}
	// Future TODOs: SET, CONTENT, SELECT
	return s;
};

yy.CreateEdge.prototype.toJS = (context) => {
	return `this.queriesfn[${this.queriesidx - 1}](this.params,null,${context})`; // Template literal for consistency
};

// COMPILE EDGE STATEMENT

yy.CreateEdge.prototype.compile = function (databaseid) {
	const dbid = databaseid;
	const fromfn = new Function('params, alasql', `return ${this.from.toJS()}`);
	const tofn = new Function('params, alasql', `return ${this.to.toJS()}`);

	let namefn, setfn;
	if (this.name !== undefined) {
		const s = `x.name=${this.name.toJS()}`;
		namefn = new Function('x', s);
	}

	if (this.sets && this.sets.length > 0) {
		const s = this.sets
			.map((st) => `x[${JSON.stringify(st.column.columnid)}]=${st.expression.toJS('x', '')}`)
			.join(';');
		setfn = new Function('x, params, alasql', `var y; ${s}`);
	}

	const statement = (params, cb) => {
		let res;
		const db = alasql.databases[dbid];
		const edge = { $id: db.counter++, $node: 'EDGE' };
		const v1 = fromfn(params, alasql);
		const v2 = tofn(params, alasql);

		// Set links and sides
		edge.$in = [v1.$id];
		edge.$out = [v2.$id];
		v1.$out = v1.$out || [];
		v1.$out.push(edge.$id);
		v2.$in = v2.$in || [];
		v2.$in.push(edge.$id);

		// Store edge and set properties if functions exist
		db.objects[edge.$id] = edge;
		namefn?.(edge); // Optional chaining
		setfn?.(edge, params, alasql);

		return cb ? cb(res) : res;
	};
	return statement;
};

// CREATE GRAPH

yy.CreateGraph = (params) => Object.assign(this, params); // Updated to arrow function
yy.CreateGraph.prototype.toString = function () {
	let s = 'CREATE GRAPH ';
	if (this.class) {
		s += `${this.class} `;
	}
	return s;
};

yy.CreateGraph.prototype.execute = function (databaseid, params, cb) {
	let res = [];
	if (this.from) {
		this.graph = alasql.from[this.from.funcid.toUpperCase()] ?? this.graph;
	}

	this.graph.forEach((g) => {
		if (!g.source) {
			createVertex(g);
		} else {
			let e = {};
			if (g.as !== undefined) alasql.vars[g.as] = e;
			if (g.prop !== undefined) e.name = g.prop;
			if (g.sharp !== undefined) e.$id = g.sharp;
			if (g.name !== undefined) e.name = g.name;
			if (g.class !== undefined) e.$class = g.class;

			let db = alasql.databases[databaseid];
			e.$id = e.$id ?? db.counter++;
			e.$node = 'EDGE';

			if (g.json !== undefined) {
				Object.assign(e, new Function('params, alasql', `return ${g.json.toJS()}`)(params, alasql));
			}

			const resolveVertex = (sourceOrTarget, isSource) => {
				let vertex, vo;
				if (sourceOrTarget.vars) {
					vo = alasql.vars[sourceOrTarget.vars];
					vertex = typeof vo === 'object' ? vo : db.objects[vo];
				} else {
					let av = sourceOrTarget.sharp || sourceOrTarget.prop;
					vertex = db.objects[av];
					if (
						vertex === undefined &&
						alasql.options.autovertex &&
						(sourceOrTarget.prop || sourceOrTarget.name)
					) {
						vertex = findVertex(sourceOrTarget.prop || sourceOrTarget.name) ?? createVertex(sourceOrTarget);
					}
				}
				if (isSource && vertex && typeof vertex.$out === 'undefined') vertex.$out = [];
				if (!isSource && vertex && typeof vertex.$in === 'undefined') vertex.$in = [];
				return vertex;
			};

			let v1 = resolveVertex(g.source, true);
			let v2 = resolveVertex(g.target, false);

			// Set links and sides
			e.$in = [v1.$id];
			e.$out = [v2.$id];
			v1.$out.push(e.$id);
			v2.$in.push(e.$id);

			db.objects[e.$id] = e;

			if (e.$class !== undefined) {
				let classTable = alasql.databases[databaseid].tables[e.$class];
				if (classTable === undefined) {
					throw new Error('No such class. Please use CREATE CLASS');
				} else {
					classTable.data.push(e);
				}
			}

			res.push(e.$id);
		}
	});

	return cb ? cb(res) : res;

	function findVertex(name) {
		return Object.values(alasql.databases[alasql.useid].objects).find((obj) => obj.name === name);
	}

	function createVertex(g) {
		const db = alasql.databases[databaseid];
		const v = {
			$id: g.sharp ?? db.counter++,
			$node: 'VERTEX',
			$name: g.name,
			$class: g.class,
		};
		if (g.json !== undefined) {
			Object.assign(v, new Function('params, alasql', `return ${g.json.toJS()}`)(params, alasql));
		}
		db.objects[v.$id] = v;
		if (v.$class !== undefined) {
			const classTable = db.tables[v.$class];
			if (!classTable) {
				throw new Error('No such class. Please use CREATE CLASS');
			} else {
				classTable.data.push(v);
			}
		}
		res.push(v.$id);
		return v;
	}
};
