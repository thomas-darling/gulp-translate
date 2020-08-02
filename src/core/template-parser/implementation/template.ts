import chalk from "chalk";
import { IContentHash } from "../../content-hash/content-hash";
import { ITemplateLanguage } from "../../template-language/template-language";
import { IContentWhitespace, WhitespaceOption, whitespaceOptions } from "../../content-whitespace/content-whitespace";
import { ITemplate, IAnnotationOptions, IAnnotation, IContent, AnnotationsOption } from "../template-parser";
import { AttributeOptions } from "./attribute-options";

// Contains the ids of all exported content instances, mapped to the hash of the content.
// This allows us to verify that we never associate different content instances with the same id.
const hashMap: { [id: string]: string } = {};

/**
 * Represents a base class for content parsed from a template.
 */
export abstract class Content implements IContent
{
    protected readonly expressions: string[];
    protected readonly contentHash: IContentHash;
    protected readonly templateLanguage: ITemplateLanguage;
    protected readonly templateWhitespace: IContentWhitespace;

    public constructor(expressions: string[], contentHash: IContentHash,
        templateLanguage: ITemplateLanguage, templateWhitespace: IContentWhitespace)
    {
        this.expressions = expressions;
        this.contentHash = contentHash;
        this.templateLanguage = templateLanguage;
        this.templateWhitespace = templateWhitespace;
    }

    public abstract readonly annotation: Annotation;

    public abstract get content(): string;

    public abstract set content(content: string);

    public get id(): string
    {
        const hash = this.contentHash.compute(this.content, this.annotation.options.hint);
        const cachedHash = hashMap[this.annotation.options.id || hash] || (hashMap[this.annotation.options.id || hash] = hash);

        if (cachedHash !== hash)
        {
            throw new Error(`An id collision was detected for id '${chalk.cyan(this.annotation.options.id || hash)}'. The id is associated with multiple different content instances.`);
        }

        return this.annotation.options.id || hash;
    }
}

/**
 * Represents content parsed from an element in a template.
 */
export class ElementContent extends Content
{
    public constructor(annotation: ElementAnnotation, expressions: string[],
        contentHash: IContentHash, templateLanguage: ITemplateLanguage, templateWhitespace: IContentWhitespace)
    {
        super(expressions, contentHash, templateLanguage, templateWhitespace);

        this.annotation = annotation;
    }

    public readonly annotation: ElementAnnotation;

    public get content(): string
    {
        const standardHtml = this.annotation.element.html();

        if (standardHtml == null)
        {
            throw new Error("Element has no content.");
        }

        const normalizedHtml = this.templateWhitespace.normalize(standardHtml, this.whitespace);

        return this.templateLanguage.toTemplateHtml(normalizedHtml, this.expressions);
    }

    public set content(templateHtml: string)
    {
        const standardHtml = this.templateLanguage.toStandardHtml(templateHtml, this.expressions);
        this.annotation.element.html(standardHtml);
    }

    private get whitespace(): WhitespaceOption
    {
        return this.annotation.options.whitespace || this.templateWhitespace.getDefault(this.annotation.element[0].tagName);
    }
}

/**
 * Represents content parsed from an attribute in a template.
 */
export class AttributeContent extends Content
{
    public constructor(annotation: AttributeAnnotation, expressions: string[],
        contentHash: IContentHash, templateLanguage: ITemplateLanguage, templateWhitespace: IContentWhitespace)
    {
        super(expressions, contentHash, templateLanguage, templateWhitespace);

        this.annotation = annotation;
    }

    public readonly annotation: AttributeAnnotation;

    public get content(): string
    {
        const standardHtml = this.annotation.element.attr(this.annotation.contentAttrName)!;
        const normalizedHtml = this.templateWhitespace.normalize(standardHtml, this.whitespace);

        return this.templateLanguage.toTemplateHtml(normalizedHtml, this.expressions);
    }

    public set content(templateHtml: string)
    {
        let standardHtml = this.templateLanguage.toStandardHtml(templateHtml, this.expressions);

        // TODO: Ideally, we should only encode the quotes if they are the same as the surrounding quotes.
        // Ensure quotes are encoded, as they might otherwise break the HTML by ending the attribute value prematurely.
        standardHtml = standardHtml
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

        this.annotation.element.attr(this.annotation.contentAttrName, standardHtml);
    }

    private get whitespace(): WhitespaceOption
    {
        return this.annotation.options.whitespace || this.templateWhitespace.getDefault(this.annotation.element[0].tagName, this.annotation.targetAttrName);
    }
}

/**
 * Represents a base class for annotations parsed from a template.
 */
export abstract class Annotation implements IAnnotation
{
    protected isNested: boolean;

    public constructor(element: Cheerio, annotationAttrName: string, isNested: boolean, isDirectAnnotation: boolean)
    {
        this.element = element;
        this.annotationAttrName = annotationAttrName;
        this.isNested = isNested;

        const annotationAttrValue = element.attr(annotationAttrName)!;

        this.translate = annotationAttrValue !== "no";

        if (!isDirectAnnotation && annotationAttrValue !== "yes" && annotationAttrValue !== "no")
        {
            this.options = new AnnotationOptions(annotationAttrValue);
            this.hasOptions = /\S/.test(annotationAttrValue);
        }
        else
        {
            this.options = new AnnotationOptions();
            this.hasOptions = false;
        }

        // If this is a direct annotation, determine whether it might actually be an orphaned annotation.
        if (isDirectAnnotation)
        {
            if (annotationAttrValue === "" || annotationAttrValue === "yes" || annotationAttrValue === "no")
            {
                this.isSuspectedOrphan = true;
            }
            else
            {
                try
                {
                    /* tslint:disable-next-line: no-unused-expression */
                    new AnnotationOptions(annotationAttrValue);
                    this.isSuspectedOrphan = true;
                }
                catch (error)
                {
                    // The value does not look like options, so no problem.
                }
            }
        }
    }

    public readonly element: Cheerio;

    public readonly annotationAttrName: string;

    public readonly translate: boolean;

    public readonly options: AnnotationOptions;

    public readonly hasOptions: boolean;

    public readonly isSuspectedOrphan: boolean;

    public abstract clean(preserveAnnotations: AnnotationsOption): void;
}

/**
 * Represents an annotation parsed from an element in a template.
 */
export class ElementAnnotation extends Annotation
{
    public constructor(element: Cheerio, annotationAttrName: string, isNested: boolean)
    {
        super(element, annotationAttrName, isNested, false);
    }

    public clean(preserveAnnotations: AnnotationsOption): void
    {
        switch (preserveAnnotations)
        {
            case "all":

                return;

            case "none":

                this.element.removeAttr(this.annotationAttrName);

                break;

            case "standard":

                this.element.removeAttr(this.annotationAttrName);

                if (this.isNested || !this.translate)
                {
                    this.element.attr("translate", this.translate ? "yes" : "no");
                }

                break;

            case "normalize":

                this.element.removeAttr(this.annotationAttrName);
                this.element.attr(this.annotationAttrName, this.translate ? "yes" : "no");

                break;
        }
    }
}

/**
 * Represents an annotation parsed from an attribute in a template.
 */
export class AttributeAnnotation extends Annotation
{
    public constructor(element: Cheerio, annotationAttrName: string, targetAttrName: string, contentAttrName: string, isNested: boolean)
    {
        super(element, annotationAttrName, isNested, contentAttrName === annotationAttrName);

        this.targetAttrName = targetAttrName;
        this.contentAttrName = contentAttrName;
    }

    public readonly targetAttrName: string;

    public contentAttrName: string;

    public clean(preserveAnnotations: AnnotationsOption): void
    {
        switch (preserveAnnotations)
        {
            case "all":

                return;

            case "none":
            case "standard":

                if (this.contentAttrName !== this.annotationAttrName)
                {
                    this.element.removeAttr(this.annotationAttrName);
                }
                else
                {
                    const content = this.element.attr(this.contentAttrName)!;
                    this.element.removeAttr(this.annotationAttrName);
                    this.contentAttrName = this.targetAttrName;
                    this.element.attr(this.contentAttrName, content);
                }

                break;

            case "normalize":

                if (this.contentAttrName !== this.annotationAttrName)
                {
                    this.element.removeAttr(this.annotationAttrName);
                    this.element.attr(this.annotationAttrName, this.translate ? "yes" : "no");
                }
                else
                {
                    const content = this.element.attr(this.contentAttrName)!;
                    this.element.removeAttr(this.annotationAttrName);
                    this.contentAttrName = this.annotationAttrName;
                    this.element.attr(this.contentAttrName, content);
                    this.element.attr(this.annotationAttrName, this.translate ? "yes" : "no");
                }

                break;
        }
    }
}

/**
 * Represents the options specified in a translation attribute.
 */
export class AnnotationOptions extends AttributeOptions implements IAnnotationOptions
{
    public constructor(attrValue?: string)
    {
        super();

        if (!attrValue)
        {
            return;
        }

        const options = this.parse(attrValue);

        if (options.hint)
        {
            this.hint = options.hint;
        }

        if (options.context)
        {
            this.context = options.context;
        }

        if (options.whitespace)
        {
            if (whitespaceOptions.indexOf(options.whitespace) < 0)
            {
                throw new Error(`The '${chalk.cyan("whitespace")}' option must be ${whitespaceOptions.map(o => `'${chalk.cyan(o)}'`).join(", ")} or ${chalk.cyan("undefined")}.`);
            }

            this.whitespace = options.whitespace as WhitespaceOption;
        }

        if (options.id)
        {
            this.id = options.id;
        }

        if (options.export)
        {
            if (options.export !== "true" && options.export !== "false")
            {
                throw new Error(`The '${chalk.cyan("export")}' option must be '${chalk.cyan("true")}', '${chalk.cyan("false")}' or ${chalk.cyan("undefined")}.`);
            }

            this.export = options.export === "true";
        }
    }

    public hint?: string;

    public context?: string;

    public whitespace?: WhitespaceOption;

    public id?: string;

    public export?: boolean;
}

/**
 * Represents the result of parsing a template instance.
 */
export class Template implements ITemplate
{
    private readonly document: CheerioStatic;
    private readonly expressions: string[];
    private readonly templateLanguage: ITemplateLanguage;

    public constructor(document: CheerioStatic, expressions: string[], contents: IContent[], annotations: IAnnotation[],
        templateLanguage: ITemplateLanguage)
    {
        this.document = document;
        this.expressions = expressions;
        this.contents = contents;
        this.annotations = annotations;
        this.templateLanguage = templateLanguage;
    }

    public readonly contents: IContent[];

    public readonly annotations: IAnnotation[];

    public toString(): string
    {
        return this.templateLanguage.toTemplateHtml(this.document.html(), this.expressions);
    }

    public clean(preserveAnnotations: AnnotationsOption): void
    {
        for (const annotation of this.annotations)
        {
            annotation.clean(preserveAnnotations);
        }
    }
}
