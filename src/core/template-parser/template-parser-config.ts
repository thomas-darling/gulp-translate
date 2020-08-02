import chalk from "chalk";

/*
 * Represents the parser configuration.
 */
export interface ITemplateParserConfig
{
    /**
     * The name of the attribute identifying elements whose content should
     * be localized.
     */
    attributeName: string;

    /**
     * The pattern used when identifying attributes whose value should be
     * localized, where '*' represents the name of the target attribute.
     */
    attributePattern: string;

    /**
     * True to enable direct annotations of attributes, such that if the
     * target attribute does not exist, the attribute matched by the attribute
     * pattern is assumed to be the attribute containing the content. This
     * means, that if no options need to be specified, we can just change
     * the attribute name to match the pattern, instead of adding a separate
     * annotation attribute. Note however, that this also means that orphaned
     * annotations will not be treated as errors, as they will be assumed to
     * contain localizable content. If enabled, warnings may be logged during
     * export, if the content looks suspiciously like an annotation.
     */
    allowDirectAnnotation: boolean;
}

/*
 * Represents the parser configuration.
 */
export class TemplateParserConfig
{
    /**
     * Creates a new instance of the TemplateParserConfig type.
     * @param config The config object from which the instance should be created.
     */
    public constructor(config: ITemplateParserConfig)
    {
        this.attributeName = config.attributeName;
        this.attributePattern = new AttributePattern(config.attributePattern, "attributePattern");
        this.allowDirectAnnotation = config.allowDirectAnnotation;
    }

    /**
     * The name of the attribute identifying elements whose content should
     * be localized.
     */
    public attributeName: string;

    /**
     * The pattern used when identifying attributes whose value should be
     * localized.
     */
    public attributePattern: AttributePattern;

    /**
     * True to enable direct annotations of attributes, such that if the
     * target attribute does not exist, the attribute matched by the attribute
     * pattern is assumed to be the attribute containing the content. This
     * means, that if no options need to be specified, we can just change
     * the attribute name to match the pattern, instead of adding a separate
     * annotation attribute. Note however, that this also means that orphaned
     * annotations will not be treated as errors, as they will be assumed to
     * contain localizable content. If enabled, warnings may be logged during
     * export, if the content looks suspiciously like an annotation.
     */
    public allowDirectAnnotation: boolean;
}

/**
 * Represents an attribute pattern, which consist of a target attribute name,
 * represented by a '*', combined with a prefix and/or a postfix.
 */
export class AttributePattern
{
    private readonly _pattern: string[];

    /**
     * Creates a new instance of the AttributePattern type.
     * @param pattern The pattern to match, which must contain a prefix and/or postfix and exactly one '*'.
     * @param optionName The name of the config option for which this instance is created.
     */
    public constructor(pattern: string, optionName: string)
    {
        this._pattern = pattern.split("*");

        if (this._pattern.length !== 2 || pattern.length < 2)
        {
            throw new Error(`The '${chalk.cyan(optionName)}' option must contain a prefix and/or postfix and exactly one '${chalk.cyan("*")}'.`);
        }
    }

    /**
     * Gets the name of the specified attribute without the prefix and postfix defined in the pattern.
     * @param matchAttrName The name of the attribute matched by the pattern.
     * @returns The attribute name without the prefix and postfix specified in the pattern, or null if the name does not match the pattern.
     */
    public getTargetName(matchAttrName: string): string | null
    {
        if (matchAttrName.length > this._pattern[0].length + this._pattern[1].length)
        {
            if (matchAttrName.substring(0, this._pattern[0].length) === this._pattern[0] &&
                matchAttrName.substring(matchAttrName.length - this._pattern[1].length) === this._pattern[1])
            {
                return matchAttrName.slice(this._pattern[0].length, matchAttrName.length - this._pattern[1].length);
            }
        }

        return null;
    }

    /**
     * Gets the name of the specified attribute with the prefix and postfix defined in the pattern.
     * @param targetAttrName The name of the target attribute.
     * @returns The attribute name that, for the specified target attribute name, would match the pattern.
     */
    public getMatchedName(targetAttrName: string): string
    {
        return this._pattern[0] + targetAttrName + this._pattern[1];
    }
}
