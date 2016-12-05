import * as chalk from "chalk";

/**
 * Represents a base class for attribute options, which provides methods for parsing and stringifying the options.
 */
export abstract class AttributeOptions
{
    /**
     * Stringifies the specified options.
     * @param options The options instance to stringify.
     * @returns An options string representing the options.
     */
    protected stringify(options: any): string
    {
        return options ? Object.keys(options).map(key => `${key}: ${options[key].toString().replace(/;/g, "\\;")}`).join("; ") : "";
    }

    /**
     * Parses the specified attribute value.
     * @param attrValue The attribute value to parse.
     * @returns An object representing the options.
     */
    protected parse(attrValue: string): any
    {
        let options = {};
        let i = 0;

        while (i < attrValue.length)
        {
            skipWhitespace(attrValue);

            if (i === attrValue.length)
            {
                return options;
            }

            const name = parseName(attrValue);

            skipWhitespace(attrValue);

            const value = parseValue(attrValue)

            skipWhitespace(attrValue);

            options[name] = value;
        }

        if (i !== attrValue.length)
        {
            throw new Error(`Expected property name at position ${chalk.magenta(i.toString())} in attribute value '${chalk.cyan(attrValue)}'.`);
        }

        return options;

        function skipWhitespace(attrValue: string): void
        {
            while (/\s/.test(attrValue[i]))
            {
                i++;
            }
        }

        function parseName(attrValue: string): string
        {
            let start = i;

            while (/[a-z-]/.test(attrValue[i]))
            {
                i++;
            }

            if (i === start || attrValue[start] === "-" || attrValue[i - 1] === "-")
            {
                throw new Error(`Expected property name at position ${chalk.magenta(start.toString())} in attribute value '${chalk.cyan(attrValue)}'.`);
            }

            let result = attrValue.slice(start, i);

            skipWhitespace(attrValue);

            if (attrValue[i] !== ":")
            {
                throw new Error(`Expected '${chalk.cyan(":")}' at position ${chalk.magenta(i.toString())} in attribute value '${chalk.cyan(attrValue)}'.`);
            }

            i++;

            return result;
        }

        function parseValue(attrValue: string): string
        {
            let start = i;
            let char = attrValue[start];
            let trimStart = 0;
            let trimEnd = 0;
            let quote: string|null = null;
            let escape = false;
            let done = false;

            if (/["'`]/.test(char))
            {
                quote = char;
                trimStart = 1;
                char = attrValue[++i];
            }

            while(char != null)
            {
                if (escape)
                {
                    escape = false;
                }
                else
                {
                    if (char === "\\")
                    {
                        escape = true;
                    }
                    else
                    {
                        if (char === quote && !done)
                        {
                            trimEnd++;
                            done = true;
                        }
                        else
                        {
                            if (char === ";")
                            {
                                break;
                            }

                            if (/\s/.test(char))
                            {
                                trimEnd++;
                            }
                            else
                            {
                                if (done)
                                {
                                    throw new Error(`Expected '${chalk.cyan(";")}' at position ${chalk.magenta(i.toString())} in attribute value '${chalk.cyan(attrValue)}'.`);
                                }

                                trimEnd = 0;
                            }
                        }

                        escape = false;
                    }
                }

                char = attrValue[++i];
            }

            if (i === start)
            {
                throw new Error(`Expected property value at position ${chalk.magenta(start.toString())} in attribute value '${chalk.cyan(attrValue)}'.`);
            }

            if (escape)
            {
                throw new Error(`Expected character at position ${chalk.magenta(i.toString())} in attribute value '${chalk.cyan(attrValue)}'.`);
            }

            if (quote && !done)
            {
                throw new Error(`Expected '${chalk.cyan(quote)}' at position ${chalk.magenta(i.toString())} in attribute value '${chalk.cyan(attrValue)}'.`);
            }

            let result = attrValue.slice(start - trimStart, i - trimEnd);

            if (char === ";")
            {
                i++;
            }

            return result;
        }
    }
}
