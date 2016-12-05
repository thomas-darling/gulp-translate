import {WhitespaceOption} from "../content-whitespace/content-whitespace";

/**
 * Represents how annotations should be preserved, where 'none' preserves no
 * annotations, 'standard' preserves HTML compliant annotations, 'normalize' preserves
 * all annotations but normalizes them to either 'yes' or 'no', and 'all' preserves
 * all annotations without any changes.
 */
export type AnnotationsOption = "none"|"standard"|"normalize"|"all";

/**
 * Represents the result of parsing a template instance.
 */
export interface ITemplate
{
    /**
     * Gets the content instances found in the template.
     */
    contents: IContent[];

    /**
     * Gets the HTML for the template, including any changes made to the content instances.
     */
    toString(): string;

    /**
     * Cleans all localization attributes related to this template instance.
     * @param preserveAnnotations Value determining how annotations should be preserved.
     */
    clean(preserveAnnotations: AnnotationsOption): void;
}

/**
 * Represents a content instance parsed from a template.
 */
export interface IContent
{
    /**
     * Gets the annotation for which the content was exported.
     */
    annotation: IAnnotation;

    /**
     * Gets or sets the content.
     */
    content: string;

    /**
     * Gets the id of the content, which may be a hash calculated based on the content
     * and hint, or an id explicitly specified in the annotation options.
     */
    id: string;
}

/**
 * Represents a content instance parsed from a template.
 */
export interface IAnnotation
{
    /**
     * Gets a value indicating whether the annotated content should be translated.
     */
    translate: boolean;

    /**
     * Gets the options specified in the annotation.
     */
    options: IAnnotationOptions;

    /**
     * Gets a value indicating whether the attribute is suspicted to be an orphaned annotation.
     */
    isSuspectedOrphan?: boolean;

    /**
     * Cleans all localization attributes related to this annotation instance.
     * @param preserveAnnotations Value determining how annotations should be preserved.
     */
    clean(preserveAnnotations: AnnotationsOption): void;
}

/**
 * Represents a content instance parsed from a template.
 */
export interface IAnnotationOptions
{
    /**
     * A string that is combined with the content before computing the hash, thus making the
     * hash different from other instances of the same content. Note that this should only
     * be used when absolutely nessesary. It should not be used to just provide helpful
     * context to translators.
     */
    hint?: string;

    /**
     * A string that is exported together with the content, which may be used to provide
     * helpful context to translators. This does not affect the computed hash.
     */
    context?: string;

    /**
     * A value indicating how whitespace should be handled when exporting content.
     * For element content, the default is 'trim', and for attribute content, the
     * default is 'pre'.
     */
    whitespace?: WhitespaceOption;

    /**
     * An id that should be used instead of the calculated hash.
     * To avoid collisions between ids and hashes, it is recommended to always use ids
     * with at least one non-alpha-numeric character, such as '#', '.' or '-'.
     */
    id?: string;

    /**
     * A value indicating whether the annotated content should be exported.
     * Default is 'false' if the 'id' option is specified, and otherwise 'true'.
     * Note that this default can be changed in the export config.
     */
    export?: boolean;
}

/**
 * Represents a parser that parses localizable content instances from an HTML string.
 */
export interface ITemplateParser
{
    /**
     * Gets all the localizable content from the specified HTML string.
     * @param html The HTML string representing the template from which the localizable content should be parsed.
     * @returns An ITemplate instance containing the localizable content found in the template.
     */
    parse(template: string): ITemplate;
}
