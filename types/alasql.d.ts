// Project: https://github.com/alasql/alasql

declare module 'alasql' {
	import * as xlsx from 'xlsx';

	// Callback interface for SQL execution results
	interface AlaSQLCallback {
		(data?: any, err?: Error): void;
	}

	// Options for AlaSQL execution configuration
	interface AlaSQLOptions {
		errorlog: boolean;
		valueof: boolean;
		dropifnotexists: boolean; // Drop database if it doesn't exist
		datetimeformat: string; // Format for DATE and DATETIME types
		casesensitive: boolean; // Case sensitivity for table and column names
		logtarget: string; // Target for logs ('console', 'output', or HTML element ID)
		logprompt: boolean; // Log SQL prompt
		modifier: 'RECORDSET' | 'VALUE' | 'ROW' | 'COLUMN' | 'MATRIX' | 'TEXTSTRING' | 'INDEX' | any; // Query result format
		columnlookup: number; // Rows to scan for column definitions
		autovertex: boolean; // Automatically create vertex if not found
		usedbo: boolean; // Use dbo as the default database (for T-SQL compatibility)
		autocommit: boolean; // Toggle AUTOCOMMIT mode
		cache: boolean; // Enable query cache
		nocount: boolean; // Toggle NOCOUNT for SET statement
		nan: boolean; // Convert NaN to undefined
		angularjs: boolean;
		tsql: boolean;
		mysql: boolean;
		postgres: boolean;
		oracle: boolean;
		sqlite: boolean;
		orientdb: boolean;
		excel: any;
	}

	// Compiled statement type with optional parameters
	interface AlaSQLStatement {
		(params?: any, cb?: AlaSQLCallback, scope?: any): any;
	}

	// Abstract Syntax Tree representation of a query
	interface AlaSQLAST {
		compile(databaseid: string): AlaSQLStatement;
	}

	// User-defined function for custom SQL functions
	type userDefinedFunction = (...args: any[]) => any;

	// Lookup for user-defined functions
	interface userDefinedFunctionLookUp {
		[name: string]: userDefinedFunction;
	}

	// Aggregator function used in SQL queries
	type userAggregator = (value: any, accumulator: any, stage: number) => any;

	// Lookup for user-defined aggregators
	interface userAggregatorLookUp {
		[name: string]: userAggregator;
	}

	// Function to handle custom FROM data sources
	interface userFromFunction {
		(dataReference: any, options: any, callback: AlaSQLCallback, index: any, query: any): any;
	}

	// Lookup for user-defined FROM functions
	interface userFromFunctionLookUp {
		[name: string]: userFromFunction;
	}

	/**
	 * AlaSQL database object - a lightweight database implementation.
	 */
	interface database {
		/**
		 * Database identifier.
		 */
		databaseid: string;

		/**
		 * Collection of tables in the database.
		 */
		tables: tableLookUp;
	}

	/**
	 * AlaSQL table object - stores tabular data for querying.
	 */
	interface table {
		/**
		 * Array of data rows within the table.
		 */
		data: any[];
	}

	/**
	 * Lookup table for multiple databases.
	 */
	interface databaseLookUp {
		[databaseName: string]: database;
	}

	/**
	 * Lookup table for multiple tables.
	 */
	interface tableLookUp {
		[tableName: string]: table;
	}

	/**
	 * Interface for database configuration and manipulation methods.
	 */
	interface Database {
		new (databaseid?: string): Database;
		databaseid: string;
		dbversion: number;
		tables: { [key: string]: any };
		views: { [key: string]: any };
		triggers: { [key: string]: any };
		indices: { [key: string]: any };
		objects: { [key: string]: any };
		counter: number;
		sqlCache: { [key: string]: any };
		sqlCacheSize: number;
		astCache: { [key: string]: any };
		resetSqlCache: () => void;
		exec: (sql: string, params?: object, cb?: AlaSQLCallback) => any;
		autoval: (tablename: string, colname: string, getNext: boolean) => any;
	}

	// Core AlaSQL interface, encapsulating query functions and configurations
	interface AlaSQL {
		options: AlaSQLOptions;
		error: Error;
		(sql: any, params?: any, cb?: AlaSQLCallback, scope?: any): any;
		parse(sql: any): AlaSQLAST;
		promise(sql: any, params?: any): Thenable<any>;
		fn: userDefinedFunctionLookUp;
		from: userFromFunctionLookUp;
		aggr: userAggregatorLookUp;
		autoval(tablename: string, colname: string, getNext?: boolean): number;
		yy: {};
		setXLSX(xlsxlib: typeof xlsx): void;
		Database: {
			new (databaseid?: string): Database;
		};

		/**
		 * Dictionary of databases managed by AlaSQL.
		 */
		databases: databaseLookUp;

		/**
		 * Switches the current database context.
		 *
		 * @param databaseid - The ID of the database to switch to.
		 */
		use(databaseid: string): void;

		/**
		 * Current active database ID. Defaults to 'alasql' if none specified.
		 */
		useid: string;

		/**
		 * Collection of tables in the current database.
		 */
		tables: tableLookUp;
	}

	// Export the AlaSQL object for external usage
	const alasql: AlaSQL;
	export = alasql;
}
