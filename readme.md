gulp-translate
===============

[![Version](https://img.shields.io/npm/v/gulp-translate.svg)](https://www.npmjs.org/package/gulp-translate)
[![Downloads](https://img.shields.io/npm/dm/gulp-translate.svg)](https://www.npmjs.com/package/gulp-translate)
[![Try on RunKit](https://badge.runkitcdn.com/gulp-translate.svg)](https://runkit.com/npm/gulp-translate)

Gulp plugin that extracts localizable content from HTML templates into a JSON file that can be sent to translators.
Once translated, the content can then be injected back into the templates as part of a localized build process, or just served to the client.

The plugin supports both element and attribute content, binding expressions, whitespace handling, context for translators, exclusion of content, and more.
Aurelia and Angular templates are supported out of the box, meaning that any HTML-like content in binding expressions will not mess up the HTML parsing,
and other template languages can be easily added. The plugin is highly configurable and versatile - see the examples in this readme and in the repository.

You may also want to look at the plugins:

* [gulp-tree-filter](https://www.npmjs.com/package/gulp-tree-filter) for filtering files based on include and exclude globs defined in config files located within the folder tree.
Use this to e.g. prevent localizable content from being extracted from unfinished features.

* [gulp-locale-filter](https://www.npmjs.com/package/gulp-locale-filter) for filtering files based on locale or language codes in the file path.
Use this to e.g. include only the locale config files that are relevant for the target locale when creating a localized build.

* [gulp-replace](https://www.npmjs.com/package/gulp-replace) for replacing text content in files.
Use this to e.g. replace placeholder such as `{{locale}}` in templates and CSS files with the actual target locale code when creating a localized build.

## Introduction

In a traditional localization workflow, localizable content is assigned unique ids and stored in a separate file. Templates that need the content can then import it by
referencing its id. While this approach can work in some apps, it has significant drawbacks that often make it annoying, inefficient and error prone in larger apps.

This plugin can absolutely support the traditional approach - for that you should look at the plugin option `replaceWithIds`, the export option `exportForId` and the annotation options `id` and `export`.
However, this plugin is primarily intended to enable a more modern and developer friendly workflow, designed with modern Translation Management Systems in mind, and taking advantage of their support for
concepts such as _translation memory_, which allows previous translations to be easily reused. This is also the approach promoted by the [HTML 5 spec](https://www.w3.org/International/questions/qa-translate-flag.en)
and by major SPA frameworks such as [Angular 2](https://angular.io/docs/ts/latest/cookbook/i18n.html).

At the core of the workflow is the idea, that when authoring templates, we write the localizable content _directly in the templates_, and then _annotate_ the elements and attributes
such that the build process will know what content to export for translation and import during localization. The id of each exported piece of content will,
unless explicitly specified, then be _computed_ as a hash based on the content itself, and optionally a _hint_. An important side effect of this is, that identical pieces of content will have
identical ids, meaning that any given content will only be translated once, thus ensuring consistency and reducing translation work.
We'll get back to why this is a better approach in the section "Why not just use ids?" at the end of this readme, along with a couple of helpful tips.

## Annotating elements and attributes

The way we annotate elements and attributes is _inspired_ by the `translate` attribute in the [HTML 5 spec](https://www.w3.org/International/questions/qa-translate-flag.en),
but does not fully adhere to that spec. This is a choice we were forced to make, as the spec simply do not handle all the real-world use cases, especially those encountered when
building SPA's. The following is the behaviour of _our_ `translate` annotations:

* There is no concept of a default set of _translatable attributes_ as in the HTML 5 spec. Instead, any attribute that should be translated must be explicitly annotated.
  This is required in order to support the many custom elements and attributes from which modern SPA's are built.

* To control translation of the content of an element, a `translate` attribute must be added.

  * To enable translation, the attribute value must be either the empty string, `yes` or an options string.

  * To exclude content from translation, e.g. if translation is enabled for an element, but an element inside of that should not be translated, the attribute value must be `no`.
    Note that it is up to the translators and their systems to respect this annotation.

* To control translation of the content of an attribute, an `{attribute}.translate` attribute must be added, where `{attribute}` is the name of the target attribute.

  * To enable translation, the attribute value must be either the empty string, `yes` or an options string.

  * To exclude content from translation, e.g. if translation is enabled for an element, but an element inside of that should not be translated, the attribute value must be `no`.
    Note that it is up to the translators and their systems to respect this annotation.

  * As a shorthand to enable translation, if no options are required, the target attribute may just be _renamed_ to `{attribute}.translate`, where the attribute value is the
    content to be translated, thus eliminating the need for a separate annotation attribute. Note that this must be explicitly enabled in the plugin options, as it prevents the parser from
    identifying orphaned attribute annotations. If enabled, the parser will instead log warnings to the console if the attribute content _looks_ like it _might_ be an orphaned annotation.

* The valid options for the `translate` and `{attribute}.translate` attributes are:

  * `hint`: A string that is combined with the content before computing the hash, thus making the hash different from other instances of the same content.
    Note that this should only be used when _absolutely_ necessary. While it may be visible to translators, it should _not_ be used to just provide helpful context.

  * `context`: A string that provides helpful context to translators.
    This does not affect the computed hash, and should only be used to help translators better understand the context.
    As different contexts could be specified for different instances of the same content, the exported context will actually be an array of the unique contexts found for that content.

  * `whitespace`: A value indicating how whitespace should be handled when exporting content.
    The options are `trim`, `pre`, `pre-line` and `normal`.
    The options `pre`, `pre-line` and `normal` behave exactly as the CSS [white-space](https://developer.mozilla.org/en/docs/Web/CSS/white-space) property.
    The option `trim`, which is the default for element content, is optimized for translation - it behaves like `normal`, except it removes any whitespace before and after the content.
    For attribute content, the default is `pre`, as whitespace would generally only be present there if intentionally added.

  * `id`: An id that should be used instead of the calculated hash.
    To avoid collisions between ids and hashes, it is recommended to always use ids with at least one non-alpha-numeric character, such as `#`, `-` or `.`.

  * `export`: A boolean value used together with `id`, specifying whether the content should be both exported and imported, or only imported.
    This is useful for handling cases where writing the same content in multiple templates is not feasible, such as for legal disclaimers or lengthy pieces of content. If content is only imported,
    it is simply assumed that it will be present in the import file at the time of import, either because it is exported from another template, from a JSON content file, or maybe explicitly added
    to the import file from a CMS system. If this option is not specified, the default is `false` if the `id` option is specified, and otherwise `true`. This default can be changed in the `export`
    config if desired.

  Note that the options syntax is like that of the standard `style` attribute, allowing multiple options to be specified, such as `hint: this is a hint; whitespace: pre`.

## Example

Assume we have the template file `template.html`, containing localizable content annotated for translation:

```html
<template>
    <div translate>Hello World</div>
    <div translate="id: app.hello; export: true">Hello World</div>
    <div translate="hint: this is different">Hello World</div>
    <div foo="Hello World" foo.translate></div>
    <div foo="Hello World" foo.translate="hint: this is different"></div>
    <div translate>Binding expressions work too: ${"</div>"}</div>
    <div translate="whitespace: pre">  Whitespace  can  be  preserved  </div>
    <div translate="context: Example of exclusion and inclusion">
        Should be translated
        <div translate="no">
            Should not be translated
            <div translate="yes">
                Should be translated
            </div>
        </div>
    </div>
</template>
```

During a build, the plugin can export a JSON file with the localizable content found in the templates.
The plugin can also remove the annotations, thus producing a "clean" template for use when debugging.

```json
{
  "7a26db32d": {
    "content": "Hello World",
    "sources": [
      "./source/template.html"
    ]
  },
  "app.hello": {
    "content": "Hello World",
    "sources": [
      "./source/template.html"
    ]
  },
  "a39a2f38f": {
    "content": "Hello World",
    "hint": "this is different",
    "sources": [
      "./source/template.html"
    ]
  },
  "b72648455": {
    "content": "Binding expressions work too: ${\"</div>\"}",
    "sources": [
      "./source/template.html"
    ]
  },
  "a0f1b132b": {
    "content": "  Whitespace  can  be  preserved  ",
    "sources": [
      "./source/template.html"
    ]
  },
  "4c2be212d": {
    "content": "Should be translated <div translate=\"no\"> Should not be translated <div translate=\"yes\"> Should be translated </div> </div>",
    "context": [
      "Example of exclusion and inclusion"
    ],
    "sources": [
      "./source/template.html"
    ]
  }
}
```

```html
<template>
    <div>Hello World</div>
    <div>Hello World</div>
    <div>Hello World</div>
    <div foo="Hello World"></div>
    <div foo="Hello World"></div>
    <div>Binding expressions won't break parsing: ${"</div>"}</div>
    <div>  Whitespace  can  be  preserved  </div>
    <div>
        Should be translated
        <div>
            Should not be translated
            <div>
                Should be translated
            </div>
        </div>
    </div>
</template>
```

The exported JSON file can then be sent to translators, who produce a translated JSON file for use with the import command, or for use on the client.
Note how translations can, if needed, be overridden within specific file or folder paths.

```json
{
  "7a26db32d": "Hello World",
  "app.hello": "Hello World",
  "a39a2f38f": "Hello Different World",
  "b72648455": "Binding expressions work too: ${\"</div>\"}",
  "a0f1b132b": "  Whitespace  can  be  preserved  ",
  "4c2be212d": "Should be translated <div translate=\"no\"> Should not be translated <div translate=\"yes\"> Should be translated </div> </div>",
  "./foo": {
    "7a26db32d": "Hello World of Foo"
  }
}
```

During a _localized_ build, the plugin can then again process the annotated templates, again producing "clean" templates,
but this time replacing the original content with the translated content provided in the JSON file.

```html
<template>
  <div>Hello World</div>
  <div>Hello World</div>
  <div>Hello Different World</div>
  <div foo="Hello World"></div>
  <div foo="Hello Different World"></div>
  <div>Binding expressions won't break parsing: ${"</div>"}</div>
  <div>  Whitespace  can  be  preserved  </div>
  <div>Should be translated <div translate="no"> Should not be translated <div translate="yes"> Should be translated </div> </div></div>
</template>
```

Additionally, to support scenarios where content is needed in code, e.g. for error or validation messages, JSON files
like the example below may also be processed, exactly like templates. If the app is using a module loader such as [SystemJS](https://github.com/systemjs/systemjs),
those JSON files can then be imported directly into ES/TypeScript modules using the [json](https://github.com/systemjs/plugin-json) plugin, which allows the code
to directly access the contents of the file as an object. To ensure the glob patterns in gulp tasks can reliably select the JSON files containing content, such files
should always either be placed in a folder with a reserved name, e.g. `strings` or `content`, or named using a reserved name, e.g. `strings.json` or `content.json`.
To avoid collisions between ids and hashes, it is recommended to use ids that contain at least one character that cannot appear in a hash - for example, we could use
ids that begin with a `#`, or always contain at least one `-` or `.`. Alternatively, you should strongly consider enabling the `prefixIdsInContentFiles` option, which
auto-prefixes the ids with the file path before exporting and importing. This makes the ids shorter, as they only have to be unique within the file, which in turn
makes it easier to reference them in code.

```json
{
  "foo": "Hello Foo",
  "bar": "Hello Bar"
}
```

When a json file containing the above is processed by the `export` command, its content is exported exactly as if it was a template.
Similarly, when the same file is later processed by the `import` command, its content will be replaced with the translated content.

Note that while the examples here use JSON files, the plugin also supports CSV files (with `,` as delimiter, quotes around values and `""` to escape quotes inside values).
Support for the industry-standard [XLIFF](https://en.wikipedia.org/wiki/XLIFF) format will be added soon.

## How to use the plugin

Install the plugin as a dev dependency:

```
npm install gulp-translate --save-dev
```

Use the plugin:

```javascript
// Import the plugin:
var translate = require("gulp-translate");

// Define the plugin config in one place, to ensure all commands use
// the same config:
var pluginConfig = { };

// Use one of the commands provided by the plugin in your gulp tasks:
.pipe(translate(pluginConfig).export(exportConfig))
.pipe(translate(pluginConfig).import(importConfig))
.pipe(translate(pluginConfig).translate(translateConfig))
```

### Plugin config

The following is the interface for the config object, that may optionally be passed to the plugin function.

```typescript
interface IPluginConfig
{
    /**
     * The name of the attribute identifying elements whose content should
     * be translated.
     * Default is 'translate'.
     */
    attributeName?: string;

    /**
     * The pattern used when identifying attributes whose content should be
     * translated, where '*' represents the name of the target attribute.
     * Default is '*.translate'.
     */
    attributePattern?: string;

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
     * Default is false.
     */
    allowDirectAnnotation?: boolean;

    /**
     * True to prefix the ids of content found in content files with the
     * relative file path of the content file, without the extension.
     * Enable this to keep the ids in content files short, thus making them
     * easier to work with in code.
     * Note that ids starting with "/" or "./" will not be prefixed.
     * An example of a prefixed id would be "./foo/bar:id", where './foo/bar'
     * is the file path without the extension and 'id' is a id in the file.
     * Default is false.
     */
    prefixIdsInContentFiles?: boolean;

    /**
     * The template language to use, or undefined to use no template language.
     * Default is undefined.
     */
    templateLanguage?: "aurelia"|"angular"|ITemplateLanguage;

    /**
     * The length of the hash identifying content, in the range [1, 32].
     * Default is 9.
     */
    hashLength?: number;
}
```

## The `export` command

Example:

```javascript
/**
 * Exports the localizable content from the templates into a JSON file,
 * which can then be sent to a translation system. Here we also remove
 * the annotations to produce a normal HTML file for the base language.
 */
gulp.task("translate.export", function ()
{
    return gulp

        // Get the source files.
        .src(["sources/**/*.html", "source/**/content.json"])

        // Export localizable content from the template.
        .pipe(translate().export(
        {
            exportFilePath: "translate/export/translate.json"
        }))

        // Write the destination file.
        .pipe(gulp.dest("artifacts"));
});
```

### The `export` config

The following is the interface for the config object, that may optionally be passed to the `export` function.

```typescript
interface IExportCommandConfig
{
    /**
     * The absolute path for the export file to which the contents should be
     * saved, or undefined to process the file without exporting its contents.
     * Default is undefined.
     */
    exportFilePath?: string;

    /**
     * True to update an existing export file, false to create a new file.
     * Default is false.
     */
    updateExportFile?: boolean;

    /**
     * True to normalize the content to ensure it has the same whitespace,
     * etc. as it would after importing content, otherwise false.
     * Default is false.
     */
    normalizeContent?: boolean;

    /**
     * The translate annotations to preserve, where 'none' preserves no
     * annotations, 'standard' preserves HTML compliant annotations,
     * 'normalize' preserves all annotations but normalizes them to either
     * 'yes' or 'no', and 'all' preserves all annotations without changes.
     * Default is 'none'.
     */
    preserveAnnotations?: "none"|"standard"|"normalize"|"all";

    /**
     * True to replace the content with its id, otherwise false. The value
     * may also be a string, in which case the content will be replaced with
     * an id formatted according to the string, where '*' represents the id.
     * Use this if you prefer injecting the localized content on the
     * client-side, e.g. by replacing ids formatted as placeholders, such as
     * '{{*}}', during template loading, by formatting the ids as actual
     * binding expressions, such as '${translations[*]}', or by otherwise
     * attaching behaviour to the annotation attributes.
     * Default is false.
     */
    replaceWithIds?: boolean|string;

    /**
     * True to export content for which the 'id' option is specified,
     * otherwise false. This can be overridden by the 'export' option.
     * Default false.
     */
    exportForId?: boolean;

    /**
     * True to log a warning to the console, if the content of a direct
     * annotation looks suspiciously like annotation options, indicating
     * that it might actually be an orphaned annotation.
     * Default is true.
     */
    logSuspectedOrphans?: boolean;

    /**
     * The base path to use when determining the relative path of files being
     * processed. This affects the source paths in export files and prefixes
     * applied to ids in content files. Specify this if you need those paths
     * to be based on a path other than the base path inferred from the globs,
     * or specified as the 'base' option for the Gulp 'src' method.
     * Default is undefined.
     */
    baseFilePath?: string;
}
```

## The `import` command

Example:

```javascript
/**
 * Imports the localized content from a JSON file received from a
 * translation system, into the templates.
 */
gulp.task("translate.import", function ()
{
    return gulp

        // Get the source files.
        .src(["sources/**/*.html", "source/**/content.json"])

        // Import translated content into the template.
        .pipe(translate(pluginConfig).import(
        {
            importFilePath: "translate/import/translate.<locale>.json"
        }))

        // Write the destination file.
        .pipe(gulp.dest("artifacts"));
});
```

### The `import` config

The following is the interface for the config object, that must be passed to the `import` function.

```typescript
interface IImportCommandConfig
{
    /**
     * The absolute path for the import file from which the contents should
     * be loaded, or an array of paths, if import should be attempted from
     * multiple import files. If multiple files are specified, the first
     * match for each content id will be used.
     */
    importFilePath: string|string[];

    /**
     * The translate annotations to preserve, where 'none' preserves no
     * annotations, 'standard' preserves HTML compliant annotations,
     * 'normalize' preserves all annotations but normalizes them to either
     * 'yes' or 'no', and 'all' preserves all annotations without changes.
     * Default is 'none'.
     */
    preserveAnnotations?: "none"|"standard"|"normalize"|"all";

    /**
     * The function to call when encountering content that is marked as
     * localizable but not found in the import file. This allows content
     * to be imported from other sources, such as e.g. a CMS system.
     * If the missing content is still not found, normal missing content
     * handling will be applied, unless the content is resolved to null,
     * in which case it will be ignored.
     * Default is undefined.
     */
    missingContentHandler?: MissingContentHandler;

    /**
     * The action to take when encountering content that is marked as
     * localizable but not found in the import file or by the missing
     * content handler, where 'error' causes an error to be thrown, 'log'
     * logs a warning to the console, and 'ignore' ignores the content.
     * Default is 'error'.
     */
    missingContentHandling?: "error"|"warn"|"ignore";

    /**
     * The base path to use when determining the relative path of files being
     * processed. This affects the prefixes applied to ids in content files.
     * Specify this if you need those paths to be based on a path other than
     * the base path inferred from the globs, or specified as the 'base'
     * option for the Gulp 'src' method.
     * Default is undefined.
     */
    baseFilePath?: string;
}

/**
 * Represents the function to call when encountering content that is marked
 * as localizable but not found in the import file. This may return the
 * content, if found, or undefined if not found. Alternatively it may return
 * a promise for the content, which may be rejected if not found.
 * Note that if rejected with an instance of Error, it will be re-thrown.
 * @param id The id for which content should be returned.
 * @param filePath The file path, relative to the base path, for the file.
 * @returns The content, a promise for the content, or undefined. Note that
 * if the content is resolved to null, it will be ignored, and the missing
 * content handling will not be applied. This is useful for partial imports,
 * where you want to selectively suppress warnings or errors for content that
 * is known to be missing.
 */
type MissingContentHandler =
    (id: string, filePath: string) => string|Promise<string>|undefined;
```

## The `translate` command

Example:

```javascript
/**
 * Simulates translation by transforming an export file into an import file,
 * where the contents is pseudo-translated, such that it can be used for
 * visually identifying content that may cause problems after translation.
 */
gulp.task("translate.pseudo", function ()
{
    return gulp

        // Get the source file.
        .src("translate/export/translate.json")

        // Translate the contents.
        .pipe(translate(pluginConfig).translate(
        {
            translator: "pseudo"
        }))

        // Rename the destination file.
        .pipe(rename({ suffix: ".pseudo" }))

        // Write the destination file.
        .pipe(gulp.dest("translate/import"));
});
```

### The `translate` config

The following is the interface for the config object, that may optionally be passed to the `translate` function.

```typescript
interface ITranslateCommandConfig
{
    /**
     * The content translator to use, or undefined to use
     * no content translator.
     * Default is undefined.
     */
    translator?: "pseudo"|IContentTranslator;

    /**
     * The extension of the destination file name, used to
     * determine its format.
     * Default is the same format as the source file.
     */
    fileNameExtension?: string;
}
```

## Why not just use ids?

In many solutions, all strings that need to be translated are stored in a separate file, and the templates then reference those strings by id, often using client-side data binding.
While this approach does work, it has significant drawbacks that make it annoying, inefficient and error prone in larger apps.

* When we need a new string, we have to somehow come up with a new unique string id, preferably consistent with the thousands of existing ids.
  We then have to add it to the strings file and reference it from the template, which is less than ideal for rapid prototyping, where templates and strings are subject to change.

* When we change the layout of the application over time, strings will inevitably move around, and their ids may become misleading as to where the string is actually used.
  We can't easily change those ids to match the new layout, as that would undermine the whole point of having a fixed id in the first place.

* When we need the same string in multiple places, keeping the translations consistent becomes complicated.
  We could reference the same string from multiple places, but what should the id of that string then be?

* When the same string is referenced from multiple places, and we decide to change the text in only one of them, we might accidentally change it everywhere.
  We could of course search for the id in the code, but can the person making the change, who may not be a developer, do that?

* When a string is no longer needed, we must remember to remove that string from the strings file.
  This is easily forgotten, and how do we even know that the string is not still used in other templates?

* It decouples the strings from the templates in which they are used, which is a problem when refactoring e.g. binding expressions, markup or class names, which may be part of the string
  that should be translated. Updating those strings are easily forgotten, which introduces bugs, and even if we do remember, we don't get any tool support for the templating syntax when editing the strings file.

* It complicates branching and testing, as string ids may be changed or removed on some branches but not on others.
  This complicates translation management and multilingual testing, as different branches need different versions of the translations.

The approach used with this plugin eases this pain considerably, leaving only a few issues to be considered:

* When a string is changed, it will appear to the translators as if the previous string was removed and a new string was added.
  While this might introduce some slight translation overhead, e.g. when fixing spelling mistakes in the templates, such overhead really should be minimal, especially given that any modern
  translation service will have what is known as _translation memory_, meaning that it remembers and suggests previous translations when it encounters similar text.

* When two occurences of the same string needs different translations, we have to either add a _hint_ to one of them, or to _scope_ the translation to a file or folder.
  This might seem like a downside, but on the other hand, it also helps guarantee consistency in translation, and in reality, this will rarely be an issue.
  While not generally recommended, we could also, when integrating with a translation system, combine the source paths with the hashes, thus ensuring a unique translation within each file.

* When a large piece of content is reused in multiple places, you might think that we have to repeat all of that content in each place.
  Generally, this is true, but on the other hand, it could also be argued that such large pieces of content should probably live in a CMS system, and therefore don't belong in the templates in the first place.
  There's a difference between content needed to construct the interface of the app itself, and the actual _content_ being displayed to users.
  This plugin is primarily intended to handle the process of localizing the app itself, not things like articles, product descriptions, legal text, etc.

  That being said, we actually _do_ have a really good way of handling such content - just specify the content once in either a JSON content file, or in a template, annotated with a `translate` attribute
  containing the options `id` and `export: true`. Then, reference it elsewhere by specifying the same `id` in the translate annotation for the elements or attributes in which it should be injected.
  If you have a CMS system, you could even set up a task to copy the relevant content from there into the import file, before running the import task, or you can use the `missingContentHandler` import option
  to specify a custom function that locates the content.

Enjoy, and please report any issues in the issue tracker :-)