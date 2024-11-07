/**
 * SPRINTF(format, argument_list)
 *
 * The string function like one in C/C++, PHP, Perl
 * Each conversion specification is defined as below:
 *
 * %[index][alignment][padding][width][precision]type
 *
 * index        An optional index specifier that changes the order of the
 *              arguments in the list to be displayed.
 * alignment    An optional alignment specifier that says if the result should be
 *              left-justified or right-justified. The default is
 *              right-justified; a "-" character here will make it left-justified.
 * padding      An optional padding specifier that says what character will be
 *              used for padding the results to the right string size. This may
 *              be a space character or a "0" (zero character). The default is to
 *              pad with spaces. An alternate padding character can be specified
 *              by prefixing it with a single quote ('). See the examples below.
 * width        An optional number, a width specifier that says how many
 *              characters (minimum) this conversion should result in.
 * precision    An optional precision specifier that says how many decimal digits
 *              should be displayed for floating-point numbers. This option has
 *              no effect for other types than float.
 * type         A type specifier that says what type the argument data should be
 *              treated as. Possible types:
 *
 * % - a literal percent character. No argument is required.
 * b - the argument is treated as an integer, and presented as a binary number.
 * c - the argument is treated as an integer, and presented as the character
 *      with that ASCII value.
 * d - the argument is treated as an integer, and presented as a decimal number.
 * u - the same as "d".
 * f - the argument is treated as a float, and presented as a floating-point.
 * o - the argument is treated as an integer, and presented as an octal number.
 * s - the argument is treated as and presented as a string.
 * x - the argument is treated as an integer and presented as a hexadecimal
 *       number (with lowercase letters).
 * X - the argument is treated as an integer and presented as a hexadecimal
 *       number (with uppercase letters).
 * h - the argument is treated as an integer and presented in human-readable format
 *       using powers of 1024.
 * H - the argument is treated as an integer and presented in human-readable format
 *       using powers of 1000.
 */

/**
 * SPRINTF(format, argument_list)
 *
 * A string formatting function similar to C/C++, PHP, and Perl.
 * The conversion specification is defined as:
 *
 * %[index][alignment][padding][width][precision]type
 */

stdfn.SPRINTF = function (...args) {
	// Using spread syntax for function arguments for better readability and flexibility
	let index = 0;

	let x;
	let ins;

	/*
	 * Callback function to handle each match in the format string.
	 */
	return args[0].replace(stdfn.SPRINTF.re, (...matchArgs) => {
		if (matchArgs[0] === '%%') {
			return '%'; // Return literal percent sign
		}

		x = matchArgs.slice(1).map(arg => arg || ''); // Map to handle undefined matches
		x[3] = x[3].slice(-1) || ' '; // Default padding character is space

		// Use the indexed argument if specified, otherwise the next argument
		ins = args[+x[1] ? x[1] - 1 : index++];
		return alasql.stdfn.SPRINTF[x[6]](ins, x); // Execute the corresponding function based on type specifier
	});
};

// Regular expression updated with comments for readability
stdfn.SPRINTF.re = /%%|%(?:(\d+)[\$#])?([+-])?('.|0| )?(\d*)(?:\.(\d+))?([bcdfosuxXhH])/g;

/**
 * Type-specific formatter functions
 */
stdfn.SPRINTF.b = (ins, x) => Number(ins).bin(x[2] + x[4], x[3]); // Binary representation

stdfn.SPRINTF.c = (ins, x) => String.fromCharCode(ins).padding(x[2] + x[4], x[3]); // Character based on ASCII code

stdfn.SPRINTF.d = stdfn.SPRINTF.u = (ins, x) => Number(ins).radix(10, x[2] + x[4], x[3]); // Decimal representation

stdfn.SPRINTF.f = (ins, x) => {
	let value = Number(ins);
	if (x[5]) {
		value = value.toFixed(x[5]); // Fixed decimal precision
	} else if (x[4]) {
		value = value.toExponential(x[4]); // Exponential format with specified width
	} else {
		value = value.toExponential(); // Default exponential format
	}
	x[2] = x[2] === '-' ? '+' : '-'; // Adjust alignment for string output
	return value.padding(x[2] + x[4], x[3]);
};

stdfn.SPRINTF.o = (ins, x) => Number(ins).oct(x[2] + x[4], x[3]); // Octal representation

stdfn.SPRINTF.s = (ins, x) => String(ins).padding(x[2] + x[4], x[3]); // String representation with padding

stdfn.SPRINTF.x = (ins, x) => Number(ins).hexl(x[2] + x[4], x[3]); // Lowercase hexadecimal

stdfn.SPRINTF.X = (ins, x) => Number(ins).hex(x[2] + x[4], x[3]); // Uppercase hexadecimal

stdfn.SPRINTF.h = (ins, x) => {
	let cleanIns = String(ins).replace(/,/g, ''); // Remove commas for number parsing
	x[2] = x[2] === '-' ? '+' : '-'; // Adjust alignment for string output
	return Number(cleanIns).human(x[5], true).padding(x[2] + x[4], x[3]); // Human-readable format in powers of 1024
};

stdfn.SPRINTF.H = (ins, x) => {
	let cleanIns = String(ins).replace(/,/g, ''); // Remove commas for number parsing
	x[2] = x[2] === '-' ? '+' : '-'; // Adjust alignment for string output
	return Number(cleanIns).human(x[5], false).padding(x[2] + x[4], x[3]); // Human-readable format in powers of 1000
};
