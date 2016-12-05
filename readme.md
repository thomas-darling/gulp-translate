gulp-translate
===============
Gulp plugin that extracts localizable content from HTML templates into a JSON file that can be sent to translators.
Once translated, the content can then be injected back into the templates as part of a localized build process, or served to the client app as data.

The plugin supports both element and attribute content, binding expressions, whitespace handling, context, exclusion of content, and more.
Aurelia and Angular templates are supported out of the box, and other templating languages can be added easily.
The plugin is highly configurable and versatile - see the examples in this readme and in the repository.

Note that Angular 2 templates are currently not well supported, as its developers stupidly decided not adhere to the HTML specification, by _requiring_ the
use of case-sensitive attribute names for directives such as `ngFor`. This is not supported by the standards-compliant HTML parser used by this plugin.

You may also want to look at the plugins:

* `gulp-locale-filter` for filtering files and folders based on locale or language codes in the path.

* `gulp-replace` for replacing text content in files, for example by replacing a placeholder like `{{locale}}` in templates and CSS files with the actual target locale code.

## Introduction

In a traditional localization workflow, localizable content is assigned unique ids and stored in a separate file. Templates that need the content can then import it by
referencing its id. While this approach can work in smaller apps, it has significant drawbacks that make it annoying, inefficient and error prone in larger apps.

This plugin can absolutely support the traditional approach, but is primarily intended to enables a more modern workflow, based on the approach promoted by the
[HTML 5 spec](https://www.w3.org/International/questions/qa-translate-flag.en) and major SPA frameworks such as [Angular 2](https://angular.io/docs/ts/latest/cookbook/i18n.html),
which are designed with modern translation management systems in mind, that support concepts such as _translations memory_ for reusing previous translations.
At the core of the workflow is the idea, that when authoring templates, we write the localizable content _directly in the templates_, and then _annotate_ the
elements and attributes such that the build process will know what content to export for translation and import during localization. The id of each exported piece of content will,
unless overridden, then be _computed_ as a hash computed based on the content itself, and optionally a _hint_. A side effect of this is, that identical content will have identical
ids, meaning that any given piece of content will only be translated once, thus ensuring consistency and reducing translation work.
See the section "Why not just use ids?" at the end of this readme for more thoughts on why this is a better approach.

The way we annotate elements and attributes, is _inspired_ by the `translate` attribute in the [HTML 5 spec](https://www.w3.org/International/questions/qa-translate-flag.en), but does not fully adhere to it. This is a choice we were forced to make,
as the spec simply do not handle all the real-world use cases, especially those encountered when building SPA's.

### The behavior of _our_ `translate` attribute:

* There is no concept of a default set of translatable attributes as in the HTML spec. Instead, any attribute that should be translated must be explicitly annotated.
  This is required in order to support the many custom elements and attributes from which modern SPA's are built.

* To control translation of the content of an element, a `translate` attribute must be added.

  * To enable translation, the attribute value must be either the empty string, `yes` or an options string.

  * To prevent translation, e.g. if translation is enabled for a ancestor element, the attribute value must be `no`.

* To control translation of the content of an attribute, an `attribute.translate` attribute must be added, where `attribute` is the name of the target attribute.

  * To enable translation, the attribute value must be either the empty string, `yes` or an options string.

  * To prevent translation, e.g. if translation is enabled for a ancestor element, the attribute value must be `no`.

  * As a shorthand to enable translation, if no options are required, the target attribute may just be _renamed_ to `attribute.translate`, where the attribute value is the
  content to be translated, thus eliminating the need of a separate annotation attribute. Note that this must be explicitly enabled in the plugin options, as it prevents the parser from
  identifying orphaned annotations. If enabled, the parser will instead try to log warnings to the console if the attribute content _looks_ like it _might_ be an orphaned annotation.

* The valid options for the `translate` and `attribute.translate` attributes are:

  * `hint`: A string that is combined with the content before computing the hash, thus making the hash different from other instances of the same content.
    Note that this should only be used when _absolutely_ nessesary. While it may be visible to translators, it should not be used to just provide helpful context.

  * `context`: A string that provides helpful context to translators.
    This does not affect the computed hash. As context could be specified for multiple instances of the same string, the actual context will be an array of context strings.

  * `whitespace`: A value indicating how whitespace should be handled when exporting content.
    The options are `trim`, `pre`, `pre-line` and `normal`.
    The options `pre`, `pre-line` and `normal` behave exactly as the CSS [white-space](https://developer.mozilla.org/en/docs/Web/CSS/white-space) property.
    The option `trim`, which is the default for element content, is optimized for translation - it behaves like `normal`, except it removes any whitespace before and after the content.
    For attribute content, the default is `pre`, as whitespace would generally only be present there if intentionally added.

  * `id`: An id that should be used instead of the calculated hash.
    To avoid collisions between ids and hashes, it is recommended to always use ids with at least one non-alpha-numeric character, such as `#` or `.`.

  * `export`: A boolean value used together with `id`, specifying whether the content should be both exported and imported, or only imported.
    This is useful for handling cases where writing the same content in multiple templates is not feasible, such as for legal disclaimers or large pieces of content.
    If content is only imported, it is simply assumed that it will be present in the import file at the time of import, either because it is exported from another template, from a JSON
    content file, or maybe explicitly added to the import file from a CMS system.
    Default is `false` if the `id` option is specified, and otherwise `true`. Note that this default can be changed in the export config.

  Note that the syntax is like the standard `style` attribute, allowing multiple options to be specified, such as `hint: this is a hint; whitespace: pre`.

### Example

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

During build, the plugin can export a JSON file with the localizable content found in the templates.
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
  "./": {
    "7a26db32d": "Hello World",
    "app.hello": "Hello World",
    "a39a2f38f": "Hello World",
    "b72648455": "Binding expressions work too: ${\"</div>\"}",
    "a0f1b132b": "  Whitespace  can  be  preserved  ",
    "4c2be212d": "Should be translated <div translate=\"no\"> Should not be translated <div translate=\"yes\"> Should be translated </div> </div>",
  },
  "./foo": {
    "7a26db32d": "Hello World of Foo"
  }
}
```

During a localized build, the plugin can then again process the annotated templates, again producing normal templates,
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
like the example below may also be processed, exactly like templates. If the solution is using a module loader such as `SystemJS`,
those JSON files can then be imported directly into ES/TypeScript modules using the `json` plugin, which allows the code
to directly access the contents of the file as an object. To ensure the glob patterns in gulp tasks can reliably select the JSON
files containing content, such files should be named consistently using a reserved name, e.g. `translate.json`.
To avoid collisions between ids and hashes, it is recommended to use ids that contain at least one character that cannot
appear in a hash - for example, we could use ids that begin with a `#`, or always contain at least one `.`.

```json
{
  "app.foo": "Hello World",
  "app.bar": "Hello World"
}
```

When a json file containing the above is processed by the `export` command, its content is exported exactly as if it was a template.
Similarly, when the same file is later processed by the `import` command, its content will be replaced with the translated content.

Note that while the examples here use JSON files, the plugin also has full support for CSV files.

## How to use

```
npm install gulp-translate --save-dev
```

```javascript
// Import the plugin:
var translate = require("gulp-translate");

// Define the plugin configuration:
var pluginConfig = { };

// Use one of the commands provided by the plugin in your gulp task:
.pipe(translate(pluginConfig).export(exportConfig))
.pipe(translate(pluginConfig).import(importConfig))
.pipe(translate(pluginConfig).translate(translateConfig))
```

## Plugin config

The following is the interface for the plugin config object, that may optionally be passed to the plugin function.

```typescript
interface IPluginConfig
{
    /**
     * The name of the attribute identifying elements whose content
     * should be translated.
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
        .src(["sources/**/*.html", "source/**/translate.json"])

        // Export localizable content from the template.
        .pipe(translate().export(
        {
            exportFilePath: "translate/export/translate.json"
        }))

        // Write the destination file.
        .pipe(gulp.dest("artifacts"));
});
```

Interface for the command config object, that may optionally be passed to the `export` function.

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
     * 'yes' or 'no', and 'all' preserves all annotations without any changes.
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
     * attaching behavior to the annotations.
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
    logSuspectedOrphans: boolean;
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
        .src(["sources/**/*.html", "source/**/translate.json"])

        // Import translated content into the template.
        .pipe(translate(pluginConfig).import(
        {
            importFilePath: "translate/import/translate.<locale>.json"
        }))

        // Write the destination file.
        .pipe(gulp.dest("artifacts"));
});
```

Interface for the command config object, that must be passed to the `import` function.

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
     * The action to take when encountering content that is marked as
     * localizable but not found in the import file, where 'error' causes
     * an error to be thrown, 'log' logs a warnign to the console, and
     * 'ignore' silently ignores the content.
     * Default is 'error'.
     */
    missingContentHandling?: "error"|"warn"|"ignore";
}
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

Interface for the command config object, that must be passed to the `import` function.

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
     * Default is the same as the source file.
     */
    fileNameExtension?: string;
}
```

## Why not just use ids?

In many solutions, all strings that need to be translated are stored in a separate file, and the templates then reference those strings by id, often using client-side data binding.
While this approach does work, it has significant drawbacks that make it annoying, inefficient and error prone in larger apps.

* When we need a new string, we have to somehow come up with a new unique string id, preferably consistent with the thousands of existing ids.
  We then have to add it to the strings file and reference it from the template, which is less than ideal for rapid prototyping, where templates and strings are subject to change.

* When we change the layout of the application over time, string will inevitably move around, and their ids may become misleading as to where the string is actually used.
  We can't easily change those ids to match the new layout, as that would undermine the whole point of having a fixed id in the first place.

* When we need the same string in multiple places, keeping the translations consistent becomes complicated.
  We could reference the same string from multiple places, but what should the id of that string then be?

* When the same string is referenced from multiple places, and we decide to change the text in only one of them, we might accidentally change it everywhere.
  We could of course search for the id in the code, but can the person making the change do that?

* When a string is no longer needed, we must remember to remove that string from the strings file.
  This is easily forgotten, and how do we know that the string is not still used in other views?

* It decouples the strings from the templates in which they are used, which is a problem when refactoring e.g. binding expressions, markup or class names, which may be part of the string
  that should be translated. Updating those strings are easily forgotten, which introduces bugs, and even if we do remember, we don't get any tool support for the templating syntax when editing the strings file.

* It complicates branching and testing, as string ids may be changed or removed on some branches but not on oters.
  This seriously complicates translation management and multilingual testing, as different branches need different versions of the translations.

The approach used with this plugin solves those problems, with only a few potential downsides:

* When a string is changed, it will appear to the translators as if the previous string was removed and a new string was added.
  While this might introduce some slight translation overhead, e.g. when fixing spelling mistakes in the templates, such overhead really should be neglible, especially given that any resonable
  translation service will have what is known as _translation memory_, meaning that it remebers and suggests previous translations for similar text.

* When the same string needs different translations, we have to either add a _hint_ to one of them, or to _scope_ the translation to a file or folder.
  This might seem like a downside, but on the other hand, it also guarantees consistency in translation - and in general, maintaining consistency is the bigger problem.
  While not recommended, we could also, when integrating with a translation system, combine the source paths with the hashes, thus ensuring a unique translation for each file.

* When a large piece of content is reused in multiple places, we generally have to write all that content in each place.
  Again, this might seem like a downside, but on the other hand, it could also be argued that such large pieces of content should probably live in a CMS system, and therefore don't
  belong in the template in the first place. There's a difference between content needed to construct the interface of the app itself, and the actual _content_ being displayed to users.
  This plugin is only intended to handle the process of localizing the app itself, not things like articles, descriptions, legal text, etc.

  That being said, we actually _do_ have a way of handling this - just specify the content in either a JSON content file, or in a template annotated with a `translate` attribute containing
  the options `id` and `export: true`. Then, reference it by specifying the same `id` in the translate annotation for the elements or attributes in which it should be injected.

Enjoy, and please report any issues in the issue tracker :-)